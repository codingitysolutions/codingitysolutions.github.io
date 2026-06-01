import { Hono } from 'hono'
import { cors } from 'hono/cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

type Bindings = {
  attendance_db: any
  JWT_SECRET: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
)

app.get('/', (c) => {
  return c.json({
    success: true,
    message: 'Attendance API Running'
  })
})

const getIndiaTime = () => {
  const now = new Date();

  const indiaDateTime = new Date(
    now.toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    })
  );

  const date = indiaDateTime.toISOString().split("T")[0];
  const hour = indiaDateTime.getHours();
  const minute = indiaDateTime.getMinutes();
  const time = indiaDateTime.toLocaleTimeString("en-IN");

  return { date, hour, minute, time };
};

// REGISTER
app.post('/api/auth/register', async (c) => {
  const { name, email, password, role, designation } = await c.req.json()

  if (!name || !email || !password) {
    return c.json(
      { success: false, message: 'All fields are required' },
      400
    )
  }

  const existing = await c.env.attendance_db
    .prepare('SELECT * FROM employees WHERE email = ?')
    .bind(email)
    .first()

  if (existing) {
    return c.json(
      { success: false, message: 'Email already exists' },
      400
    )
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  await c.env.attendance_db
    .prepare(
      'INSERT INTO employees (name,email,password,role,designation) VALUES (?,?,?,?,?)'
    )
    .bind(
      name,
      email,
      hashedPassword,
      role || 'employee',
      designation || ''
    )
    .run()

  return c.json({
    success: true,
    message: 'Employee registered successfully'
  })
})

// LOGIN
app.post('/api/auth/login', async (c) => {
  const { email, password } = await c.req.json()

  const user: any = await c.env.attendance_db
    .prepare('SELECT * FROM employees WHERE email = ?')
    .bind(email)
    .first()

  if (!user) {
    return c.json(
      { success: false, message: 'Invalid credentials' },
      401
    )
  }

  const isMatch = await bcrypt.compare(
    password,
    user.password
  )

  if (!isMatch) {
    return c.json(
      { success: false, message: 'Invalid credentials' },
      401
    )
  }

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    c.env.JWT_SECRET || 'codingity_attendance_2026',
    {
      expiresIn: '7d'
    }
  )

  return c.json({
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      designation: user.designation
    }
  })
})

// CHECK IN
app.post('/api/attendance/checkin', async (c) => {
  const { employeeId, latitude, longitude } = await c.req.json();

  if (!latitude || !longitude) {
    return c.json({
      success: false,
      message: "Location is required. Please turn ON location."
    }, 400);
  }

  const { date: today, hour, minute, time: checkIn } = getIndiaTime();

  if (hour < 9 || (hour === 9 && minute < 55)) {
    return c.json({
      success: false,
      message: "Check-in time not started. It starts at 9:55 AM."
    }, 400);
  }

  if (hour > 10 || (hour === 10 && minute > 30)) {
    return c.json({
      success: false,
      message: "Check-in time is over. Last time is 10:30 AM."
    }, 400);
  }

  const existing = await c.env.attendance_db
    .prepare('SELECT * FROM attendance WHERE employee_id = ? AND date = ?')
    .bind(employeeId, today)
    .first();

  if (existing) {
    return c.json({
      success: false,
      message: "Already checked in today"
    }, 400);
  }

  await c.env.attendance_db
    .prepare(
      `INSERT INTO attendance
      (employee_id,date,check_in,status,latitude,longitude)
      VALUES (?,?,?,?,?,?)`
    )
    .bind(employeeId, today, checkIn, "Present", latitude, longitude)
    .run();

  return c.json({
    success: true,
    message: "Check In Successful"
  });
});

// CHECK OUT
app.post('/api/attendance/checkout', async (c) => {
  const { employeeId } = await c.req.json()

  const { date: today, hour, time: checkOut } = getIndiaTime();

let status = 'Full Day'

if (hour < 17) {
  status = 'Half Day'
}

  const record: any = await c.env.attendance_db
    .prepare(
      'SELECT * FROM attendance WHERE employee_id = ? AND date = ?'
    )
    .bind(employeeId, today)
    .first()

  if (!record) {
    return c.json({
      success: false,
      message: 'Please check in first'
    })
  }

  if (record.check_out) {
  return c.json({
    success: false,
    message: 'Already checked out'
  })
}

  await c.env.attendance_db
   .prepare(
  'UPDATE attendance SET check_out = ?, status = ? WHERE id = ?'
)
.bind(
  checkOut,
  status,
  record.id
)
    .run()

  return c.json({
    success: true,
    message: 'Check Out Successful'
  })
})

// ATTENDANCE HISTORY
app.get('/api/attendance/history/:employeeId', async (c) => {
  const employeeId = c.req.param('employeeId')

  const result = await c.env.attendance_db
    .prepare(
      'SELECT * FROM attendance WHERE employee_id = ? ORDER BY id DESC'
    )
    .bind(employeeId)
    .all()

  return c.json({
    success: true,
    data: result.results
  })
})



// ALL EMPLOYEES
app.get('/api/admin/employees', async (c) => {
  const result = await c.env.attendance_db
    .prepare(
      'SELECT id,name,email,designation,role FROM employees ORDER BY id DESC'
    )
    .all()

  return c.json({
    success: true,
    employees: result.results
  })
})


// TODAY STATS
app.get('/api/admin/stats', async (c) => {
  const today = new Date().toISOString().split('T')[0]

  const present: any = await c.env.attendance_db
  .prepare(
    `
    SELECT COUNT(*) as total
    FROM attendance
    WHERE date = ?
    AND check_out IS NULL
    `
  )
  .bind(today)
  .first()

  const employees: any = await c.env.attendance_db
    .prepare(
      'SELECT COUNT(*) as total FROM employees WHERE role = ?'
    )
    .bind('employee')
    .first()

  return c.json({
    success: true,
    totalEmployees: employees.total,
    presentToday: present.total,
    absentToday:
      employees.total - present.total
  })
})


// DELETE EMPLOYEE
app.delete('/api/admin/employee/:id', async (c) => {
  const id = c.req.param('id')

  await c.env.attendance_db
    .prepare('DELETE FROM employees WHERE id = ?')
    .bind(id)
    .run()

  return c.json({
    success: true,
    message: 'Employee Deleted'
  })
})




// ATTENDANCE REPORT
app.get('/api/admin/attendance-report', async (c) => {
  const result = await c.env.attendance_db
    .prepare(`
      SELECT
        attendance.id,
        employees.name,
        employees.email,
        employees.designation,
        attendance.date,
        attendance.check_in,
        attendance.check_out,
        attendance.status,
        attendance.latitude,
        attendance.longitude
      FROM attendance
      LEFT JOIN employees
      ON attendance.employee_id = employees.id
      ORDER BY attendance.id DESC
    `)
    .all()

  return c.json({
    success: true,
    records: result.results
  })
})


// UPDATE EMPLOYEE
app.put('/api/admin/employee/:id', async (c) => {
  const id = c.req.param('id')

  const {
    name,
    email,
    designation
  } = await c.req.json()

  await c.env.attendance_db
    .prepare(
      `
      UPDATE employees
      SET name = ?,
          email = ?,
          designation = ?
      WHERE id = ?
    `
    )
    .bind(
      name,
      email,
      designation,
      id
    )
    .run()

  return c.json({
    success: true,
    message: 'Employee Updated'
  })
})


// MONTHLY ATTENDANCE SUMMARY
app.get('/api/admin/monthly-summary', async (c) => {
  const result = await c.env.attendance_db
    .prepare(`
      SELECT
        employees.name,
        employees.designation,
        COUNT(
  CASE
    WHEN attendance.status = 'Full Day'
    THEN 1
  END
) as totalDays
      FROM employees
      LEFT JOIN attendance
      ON employees.id = attendance.employee_id
      GROUP BY employees.id
      ORDER BY totalDays DESC
    `)
    .all()

  return c.json({
    success: true,
    summary: result.results
  })
})
export default app