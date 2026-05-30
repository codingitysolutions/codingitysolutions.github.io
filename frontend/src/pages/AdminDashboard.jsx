import { useState, useEffect } from "react";
import { API } from "../services/api";
import { saveAs } from "file-saver";
import "./AdminDashboard.css";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [designation, setDesignation] = useState("");

  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState([]);

  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
  });
  const handleLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  navigate("/");
};

  const loadEmployees = async () => {
    try {
      const res = await API.get("/api/admin/employees");
      setEmployees(res.data.employees || []);
    } catch (err) {
      console.log(err);
    }
  };

  const loadStats = async () => {
    try {
      const res = await API.get("/api/admin/stats");

      setStats({
        totalEmployees: res.data.totalEmployees || 0,
        presentToday: res.data.presentToday || 0,
        absentToday: res.data.absentToday || 0,
      });
    } catch (err) {
      console.log(err);
    }
  };

  const loadAttendance = async () => {
    try {
      const res = await API.get("/api/admin/attendance-report");
      setAttendance(res.data.records || []);
    } catch (err) {
      console.log(err);
    }
  };

  const loadMonthlySummary = async () => {
    try {
      const res = await API.get("/api/admin/monthly-summary");
      setMonthlySummary(res.data.summary || []);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    loadEmployees();
    loadStats();
    loadAttendance();
    loadMonthlySummary();
  }, []);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setDesignation("");
    setEditingId(null);
  };

  const addEmployee = async () => {
    try {
      await API.post("/api/auth/register", {
        name,
        email,
        password,
        designation,
        role: "employee",
      });

      alert("Employee Added Successfully");
      resetForm();
      loadEmployees();
      loadStats();
      loadMonthlySummary();
    } catch (error) {
      console.log(error);
      alert("Error adding employee");
    }
  };

  const updateEmployee = async () => {
    try {
      await API.put(`/api/admin/employee/${editingId}`, {
        name,
        email,
        designation,
      });

      alert("Employee Updated");
      resetForm();
      loadEmployees();
      loadMonthlySummary();
    } catch (err) {
      console.log(err);
      alert("Update Failed");
    }
  };

  const deleteEmployee = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this employee?"
    );

    if (!confirmDelete) return;

    try {
      await API.delete(`/api/admin/employee/${id}`);

      alert("Employee Deleted");
      loadEmployees();
      loadStats();
      loadAttendance();
      loadMonthlySummary();
    } catch (err) {
      console.log(err);
      alert("Delete Failed");
    }
  };

  const exportAttendanceCSV = () => {
    const headers = [
      "Name",
      "Designation",
      "Date",
      "Check In",
      "Check Out",
      "Status",
      "Latitude",
      "Longitude",
    ];

    const rows = attendance.map((item) => [
      item.name || "",
      item.designation || "",
      item.date || "",
      item.check_in || "",
      item.check_out || "",
      item.status || "",
      item.latitude || "",
      item.longitude || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${cell}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    saveAs(blob, "attendance-report.csv");
  };

  const filteredEmployees = employees.filter((emp) =>
    `${emp.name} ${emp.email} ${emp.designation}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

   return (

  <div className="admin-page">

    <div

      style={{

        display: "flex",

        justifyContent: "space-between",

        alignItems: "center",

        marginBottom: "30px",

      }}

    >

      <div>

        <h1>Codingity Attendance Management</h1>

        <p>Manage Employees, Attendance & Analytics</p>

      </div>

      <button

        onClick={handleLogout}

        className="logout-btn"

      >

        Logout

      </button>

    </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Employees</h3>
          <h1>{stats.totalEmployees}</h1>
        </div>

        <div className="stat-card">
          <h3>Present Today</h3>
          <h1>{stats.presentToday}</h1>
        </div>

        <div className="stat-card">
          <h3>Absent Today</h3>
          <h1>{stats.absentToday}</h1>
        </div>
      </div>

      <hr />

      <h2>{editingId ? "Edit Employee" : "Add Employee"}</h2>

      <input
        placeholder="Employee Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <br /><br />

      <input
        placeholder="Employee Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <br /><br />

      <input
        placeholder="Designation"
        value={designation}
        onChange={(e) => setDesignation(e.target.value)}
      />

      <br /><br />

      {!editingId && (
        <>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <br /><br />
        </>
      )}

      {editingId ? (
        <>
          <button onClick={updateEmployee}>
            Update Employee
          </button>

          <button
            onClick={resetForm}
            style={{ marginLeft: "10px" }}
          >
            Cancel
          </button>
        </>
      ) : (
        <button onClick={addEmployee}>
          Add Employee
        </button>
      )}

      <hr />

      <h2>Employees List</h2>

      <input
        className="search-box"
        placeholder="Search Employee..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <br /><br />

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Designation</th>
            <th>Role</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {filteredEmployees.map((emp) => (
            <tr key={emp.id}>
              <td>{emp.name}</td>
              <td>{emp.email}</td>
              <td>{emp.designation}</td>
              <td>{emp.role}</td>

              <td>
                <button
                  onClick={() => {
                    setEditingId(emp.id);
                    setName(emp.name || "");
                    setEmail(emp.email || "");
                    setDesignation(emp.designation || "");
                    setPassword("");
                  }}
                >
                  Edit
                </button>

                <button
                  style={{
                    marginLeft: "10px",
                    background: "#ef4444",
                  }}
                  onClick={() =>
                    deleteEmployee(emp.id)
                  }
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <hr />

      <h2>Attendance Report</h2>

      <button
        onClick={exportAttendanceCSV}
        style={{ marginBottom: "15px" }}
      >
        Export CSV
      </button>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Designation</th>
            <th>Date</th>
            <th>Check In</th>
            <th>Check Out</th>
            <th>Status</th>
            <th>Location</th>
          </tr>
        </thead>

        <tbody>
          {attendance.map((item) => (
            <tr key={item.id}>
              <td>{item.name || "-"}</td>
              <td>{item.designation || "-"}</td>
              <td>{item.date || "-"}</td>
              <td>{item.check_in || "-"}</td>
              <td>{item.check_out || "-"}</td>
              <td>{item.status || "-"}</td>
              <td>
                {item.latitude &&
                item.longitude ? (
                  <a
                    href={`https://maps.google.com/?q=${item.latitude},${item.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View Map
                  </a>
                ) : (
                  "-"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <hr />

      <h2>Monthly Attendance Summary</h2>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Designation</th>
            <th>Total Present Days</th>
          </tr>
        </thead>

        <tbody>
          {monthlySummary.map(
            (item, index) => (
              <tr key={index}>
                <td>{item.name || "-"}</td>
                <td>
                  {item.designation || "-"}
                </td>
                <td>{item.totalDays || 0}</td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}