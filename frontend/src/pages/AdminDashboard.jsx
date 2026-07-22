import { useState, useEffect } from "react";
import { API } from "../services/api";
import { saveAs } from "file-saver";
import { useNavigate } from "react-router-dom";
import {
  Users,
  UserCheck,
  UserX,
  Plus,
  Search,
  LogOut,
  MapPin,
  Download,
  Target,
  Edit2,
  Trash2,
  BarChart3,
  Calendar,
  CheckCircle2,
  Briefcase,
  AlertCircle,
} from "lucide-react";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview"); // overview | employees | attendance | assign-work

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [designation, setDesignation] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  // Lists & Stats
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState([]);
  const [targets, setTargets] = useState([]);

  // Work Assignment State
  const [targetEmployeeId, setTargetEmployeeId] = useState("");
  const [targetText, setTargetText] = useState("");
  const [targetDate, setTargetDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Filter & Edit State
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', text: '' }

  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
  });

  const showToast = (text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

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
      console.error(err);
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
      console.error(err);
    }
  };

  const loadAttendance = async () => {
    try {
      const res = await API.get("/api/admin/attendance-report");
      setAttendance(res.data.records || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMonthlySummary = async () => {
    try {
      const res = await API.get("/api/admin/monthly-summary");
      setMonthlySummary(res.data.summary || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadTargets = async () => {
    try {
      const res = await API.get("/api/admin/targets");
      setTargets(res.data.targets || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadEmployees();
    loadStats();
    loadAttendance();
    loadMonthlySummary();
    loadTargets();

    // Auto-update dashboard content every 5 seconds for real-time tracking
    const intervalId = setInterval(() => {
      loadStats();
      loadAttendance();
      loadTargets();
      loadMonthlySummary();
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setDesignation("");
    setEmployeeId("");
    setPhotoUrl("");
    setEditingId(null);
  };

  const addEmployee = async (e) => {
    if (e) e.preventDefault();
    if (!name || !email || !password) {
      showToast("Name, Email and Password are required", "error");
      return;
    }

    try {
      await API.post("/api/auth/register", {
        name,
        email,
        password,
        designation,
        employee_id: employeeId,
        photo_url: photoUrl,
        role: "employee",
      });

      showToast("Employee added successfully!");
      resetForm();
      loadEmployees();
      loadStats();
      loadMonthlySummary();
    } catch (error) {
      console.error(error);
      showToast(
        error.response?.data?.message || "Failed to add employee",
        "error"
      );
    }
  };

  const updateEmployee = async (e) => {
    if (e) e.preventDefault();
    try {
      await API.put(`/api/admin/employee/${editingId}`, {
        name,
        email,
        designation,
        employee_id: employeeId,
        photo_url: photoUrl,
      });

      showToast("Employee details updated!");
      resetForm();
      loadEmployees();
      loadMonthlySummary();
    } catch (err) {
      console.error(err);
      showToast("Failed to update employee", "error");
    }
  };

  const deleteEmployee = async (id) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) return;

    try {
      await API.delete(`/api/admin/employee/${id}`);
      showToast("Employee deleted successfully");
      loadEmployees();
      loadStats();
      loadAttendance();
      loadMonthlySummary();
    } catch (err) {
      console.error(err);
      showToast("Failed to delete employee", "error");
    }
  };

  const assignTarget = async (e) => {
    if (e) e.preventDefault();
    if (!targetEmployeeId || !targetText) {
      showToast("Please select an employee and enter work details", "error");
      return;
    }

    try {
      await API.post("/api/admin/assign-target", {
        employee_id: targetEmployeeId,
        target_text: targetText,
        target_date: targetDate,
      });

      showToast("Work target assigned successfully!");
      setTargetText("");
      loadTargets();
    } catch (err) {
      console.error(err);
      showToast("Failed to assign target", "error");
    }
  };

  const deleteTarget = async (id) => {
    try {
      await API.delete(`/api/admin/target/${id}`);
      showToast("Work target deleted");
      loadTargets();
    } catch (err) {
      console.error(err);
      showToast("Failed to delete target", "error");
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
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    saveAs(blob, `attendance-report-${new Date().toISOString().split("T")[0]}.csv`);
  };

  const filteredEmployees = employees.filter((emp) =>
    `${emp.name} ${emp.email} ${emp.designation} ${emp.employee_id}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="admin-page fade-in">
      {/* Toast Notification Banner */}
      {toast && (
        <div className={`toast-msg toast-${toast.type}`}>
          <AlertCircle size={18} />
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header */}
      <header className="admin-header">
        <div className="brand-container">
          <div className="brand-logo-box" style={{ background: "transparent", border: "none" }}>
            <img src="/codingity-logo.png" alt="Codingity Logo" className="brand-logo-img" style={{ width: "44px", height: "44px", objectFit: "contain" }} />
          </div>
          <div className="brand-info">
            <h1>Codingity Dashboard</h1>
            <p>Enterprise Attendance & Workforce Management</p>
          </div>
        </div>

        <button onClick={handleLogout} className="logout-btn">
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </header>

      {/* Navigation Tabs */}
      <div className="admin-tabs">
        <button
          className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          <BarChart3 size={18} />
          <span>Overview</span>
        </button>
        <button
          className={`tab-btn ${activeTab === "employees" ? "active" : ""}`}
          onClick={() => setActiveTab("employees")}
        >
          <Users size={18} />
          <span>Employees ({employees.length})</span>
        </button>
        <button
          className={`tab-btn ${activeTab === "attendance" ? "active" : ""}`}
          onClick={() => setActiveTab("attendance")}
        >
          <Calendar size={18} />
          <span>Attendance Report</span>
        </button>
        <button
          className={`tab-btn ${activeTab === "assign-work" ? "active" : ""}`}
          onClick={() => setActiveTab("assign-work")}
        >
          <Target size={18} />
          <span>Assign Work</span>
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="tab-content fade-in">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-info">
                <h3>Total Employees</h3>
                <h1>{stats.totalEmployees}</h1>
              </div>
              <div className="stat-icon-wrapper blue">
                <Users size={28} />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <h3>Present Today</h3>
                <h1>{stats.presentToday}</h1>
              </div>
              <div className="stat-icon-wrapper green">
                <UserCheck size={28} />
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-info">
                <h3>Absent Today</h3>
                <h1>{stats.absentToday}</h1>
              </div>
              <div className="stat-icon-wrapper red">
                <UserX size={28} />
              </div>
            </div>
          </div>

          <div className="content-card">
            <div className="card-header-bar">
              <div className="card-title-group">
                <BarChart3 size={22} className="brand-icon" />
                <h2>Monthly Attendance Summary</h2>
              </div>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Designation</th>
                    <th>Total Present Days</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlySummary.length === 0 ? (
                    <tr>
                      <td colSpan="3" style={{ textAlign: "center", color: "var(--text-dim)" }}>
                        No monthly attendance data available
                      </td>
                    </tr>
                  ) : (
                    monthlySummary.map((item, idx) => (
                      <tr key={idx}>
                        <td>
                          <strong>{item.name || "-"}</strong>
                        </td>
                        <td>{item.designation || "-"}</td>
                        <td>
                          <span className="badge badge-present">{item.totalDays || 0} Days</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Employees Tab */}
      {activeTab === "employees" && (
        <div className="tab-content fade-in">
          {/* Add / Edit Employee Form Card */}
          <div className="content-card">
            <div className="card-header-bar">
              <div className="card-title-group">
                <Plus size={22} className="brand-icon" />
                <h2>{editingId ? "Edit Employee Details" : "Add New Employee"}</h2>
              </div>
            </div>

            <form onSubmit={editingId ? updateEmployee : addEmployee}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Rahul Sharma"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. rahul@codingity.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Designation</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Fullstack Developer"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Employee ID Code</label>
                  <input
                    className="form-input"
                    placeholder="e.g. EMP-101"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Photo URL (Optional)</label>
                  <input
                    className="form-input"
                    placeholder="https://..."
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                  />
                </div>

                {!editingId && (
                  <div className="form-group">
                    <label>Account Password *</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                <button type="submit" className="btn-primary">
                  {editingId ? (
                    <>
                      <Edit2 size={18} />
                      <span>Update Employee</span>
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      <span>Add Employee</span>
                    </>
                  )}
                </button>

                {editingId && (
                  <button type="button" className="btn-secondary" onClick={resetForm}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Employees List Card */}
          <div className="content-card">
            <div className="card-header-bar">
              <div className="card-title-group">
                <Users size={22} className="brand-icon" />
                <h2>Employee Directory</h2>
              </div>

              <div className="search-wrapper">
                <Search size={18} className="search-icon" />
                <input
                  className="search-box"
                  placeholder="Search by name, email or designation..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Email</th>
                    <th>Designation</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center", color: "var(--text-dim)" }}>
                        No employees found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => (
                      <tr key={emp.id}>
                        <td>
                          <div className="avatar-cell">
                            {emp.photo_url ? (
                              <img src={emp.photo_url} alt={emp.name} className="avatar-img" />
                            ) : (
                              <div className="avatar-placeholder">
                                {emp.name ? emp.name.charAt(0).toUpperCase() : "E"}
                              </div>
                            )}
                            <div>
                              <strong>{emp.name}</strong>
                              {emp.employee_id && (
                                <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                                  ID: {emp.employee_id}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>{emp.email}</td>
                        <td>{emp.designation || "-"}</td>
                        <td>
                          <span className="badge badge-in-progress">{emp.role}</span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              className="btn-edit"
                              onClick={() => {
                                setEditingId(emp.id);
                                setName(emp.name || "");
                                setEmail(emp.email || "");
                                setDesignation(emp.designation || "");
                                setEmployeeId(emp.employee_id || "");
                                setPhotoUrl(emp.photo_url || "");
                                setPassword("");
                              }}
                            >
                              <Edit2 size={15} />
                              <span>Edit</span>
                            </button>
                            <button
                              className="btn-danger"
                              onClick={() => deleteEmployee(emp.id)}
                            >
                              <Trash2 size={15} />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Report Tab */}
      {activeTab === "attendance" && (
        <div className="tab-content fade-in">
          <div className="content-card">
            <div className="card-header-bar">
              <div className="card-title-group">
                <Calendar size={22} className="brand-icon" />
                <h2>Attendance Logs</h2>
              </div>

              <button className="btn-primary" onClick={exportAttendanceCSV}>
                <Download size={18} />
                <span>Export CSV Report</span>
              </button>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Employee Name</th>
                    <th>Designation</th>
                    <th>Date</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Status</th>
                    <th>Geolocation Map</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: "center", color: "var(--text-dim)" }}>
                        No attendance records recorded yet.
                      </td>
                    </tr>
                  ) : (
                    attendance.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.name || "-"}</strong>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                            {item.email}
                          </div>
                        </td>
                        <td>{item.designation || "-"}</td>
                        <td>{item.date || "-"}</td>
                        <td>{item.check_in || "-"}</td>
                        <td>{item.check_out || "-"}</td>
                        <td>
                          <span
                            className={`badge badge-${
                              item.status === "Present" || item.status === "Full Day"
                                ? "present"
                                : item.status === "Half Day"
                                ? "halfday"
                                : "pending"
                            }`}
                          >
                            {item.status || "Present"}
                          </span>
                        </td>
                        <td>
                          {item.latitude && item.longitude ? (
                            <a
                              className="map-link-btn"
                              href={`https://maps.google.com/?q=${item.latitude},${item.longitude}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <MapPin size={14} />
                              <span>View Location</span>
                            </a>
                          ) : (
                            <span style={{ color: "var(--text-dim)" }}>-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Assign Work / Target Tab */}
      {activeTab === "assign-work" && (
        <div className="tab-content fade-in">
          {/* Assign Work Form */}
          <div className="content-card">
            <div className="card-header-bar">
              <div className="card-title-group">
                <Target size={22} className="brand-icon" />
                <h2>Assign Work / Daily Target</h2>
              </div>
            </div>

            <form onSubmit={assignTarget}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Select Employee *</label>
                  <select
                    className="form-select"
                    value={targetEmployeeId}
                    onChange={(e) => setTargetEmployeeId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Employee --</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.designation || "Employee"}{" "}
                        {emp.employee_id ? `| ${emp.employee_id}` : ""})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Target Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: "1 / -1" }}>
                  <label>Task / Work Details *</label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    placeholder="Describe the tasks assigned for today (e.g. Build login module, review PR #42, update customer report)..."
                    value={targetText}
                    onChange={(e) => setTargetText(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary">
                <Target size={18} />
                <span>Assign Work Target</span>
              </button>
            </form>
          </div>

          {/* Assigned Work Monitor */}
          <div className="content-card">
            <div className="card-header-bar">
              <div className="card-title-group">
                <CheckCircle2 size={22} className="brand-icon" />
                <h2>Live Assigned Work Monitor</h2>
              </div>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Assigned To</th>
                    <th>Target Date</th>
                    <th>Task Description</th>
                    <th>Current Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {targets.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center", color: "var(--text-dim)" }}>
                        No work targets assigned yet.
                      </td>
                    </tr>
                  ) : (
                    targets.map((tgt) => (
                      <tr key={tgt.id}>
                        <td>
                          <strong>{tgt.employee_name || `Employee #${tgt.employee_id}`}</strong>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                            {tgt.employee_designation || tgt.employee_email}
                          </div>
                        </td>
                        <td>{tgt.target_date}</td>
                        <td style={{ maxWidth: "350px", wordBreak: "break-word" }}>
                          {tgt.target_text}
                        </td>
                        <td>
                          <span
                            className={`badge badge-${
                              tgt.status === "Completed"
                                ? "completed"
                                : tgt.status === "In Progress"
                                ? "in-progress"
                                : "pending"
                            }`}
                          >
                            {tgt.status || "Pending"}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn-danger"
                            onClick={() => deleteTarget(tgt.id)}
                          >
                            <Trash2 size={14} />
                            <span>Remove</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}