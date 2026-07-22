CREATE TABLE employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'employee',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attendance (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  check_in TEXT,
  check_out TEXT,
  status TEXT DEFAULT 'Present',
  FOREIGN KEY(employee_id) REFERENCES employees(id)
);

CREATE UNIQUE INDEX idx_attendance_unique
ON attendance(employee_id, date);

CREATE TABLE daily_targets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id INTEGER NOT NULL,
  target_text TEXT NOT NULL,
  target_date TEXT NOT NULL,
  status TEXT DEFAULT 'Pending'
);