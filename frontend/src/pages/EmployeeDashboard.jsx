import { useEffect, useState } from "react";
import { API } from "../services/api";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  CheckCircle2,
  PlayCircle,
  LogOut,
  MapPin,
  Calendar,
  AlertCircle,
  Briefcase,
  UserCheck,
} from "lucide-react";
import "./EmployeeDashboard.css";

export default function EmployeeDashboard() {
  const [user, setUser] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState("Not Checked In");
  const [target, setTarget] = useState(null);
  const [history, setHistory] = useState([]);
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard"); // dashboard | history

  const navigate = useNavigate();

  const showToast = (text, type = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Live clock ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      setCurrentDate(
        now.toLocaleDateString("en-IN", {
          timeZone: "Asia/Kolkata",
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    setUser(savedUser);

    if (savedUser) {
      loadTodayAttendance(savedUser.id);
      loadTodayTarget(savedUser.id);
      loadAttendanceHistory(savedUser.id);

      // Auto-update attendance status, targets, and history logs every 5 seconds
      const intervalId = setInterval(() => {
        loadTodayAttendance(savedUser.id);
        loadTodayTarget(savedUser.id);
        loadAttendanceHistory(savedUser.id);
      }, 5000);

      return () => clearInterval(intervalId);
    }
  }, []);

  const loadTodayTarget = async (employeeId) => {
    try {
      const res = await API.get(`/api/employee/today-target/${employeeId}`);
      setTarget(res.data.target || null);
    } catch (err) {
      console.error(err);
    }
  };

  const loadTodayAttendance = async (employeeId) => {
    try {
      const res = await API.get(`/api/attendance/history/${employeeId}`);
      const today = new Date().toLocaleDateString("en-CA");

      const todayRecord = (res.data.data || []).find((item) => item.date === today);

      if (!todayRecord) {
        setAttendanceStatus("Not Checked In");
        return;
      }

      if (todayRecord.check_out) {
        setAttendanceStatus("Checked Out ✅");
      } else {
        setAttendanceStatus("Checked In ✅");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadAttendanceHistory = async (employeeId) => {
    try {
      const res = await API.get(`/api/attendance/history/${employeeId}`);
      setHistory(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleCheckIn = () => {
    if (!user) return;

    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by your browser.", "error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await API.post("/api/attendance/checkin", {
            employeeId: user.id,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });

          showToast(res?.data?.message || "Check In Successful!");
          loadTodayAttendance(user.id);
          loadAttendanceHistory(user.id);
        } catch (err) {
          console.error(err);
          showToast(
            err?.response?.data?.message || "Check In Failed",
            "error"
          );
        }
      },
      (error) => {
        console.error(error);
        if (error.code === 1) {
          showToast("Location permission denied. Please allow GPS.", "error");
        } else {
          showToast("Failed to fetch current location.", "error");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleCheckOut = async () => {
    if (!user) return;

    try {
      const res = await API.post("/api/attendance/checkout", {
        employeeId: user.id,
      });

      showToast(res?.data?.message || "Check Out Successful!");
      setAttendanceStatus("Checked Out ✅");
      loadTodayAttendance(user.id);
      loadAttendanceHistory(user.id);
    } catch (err) {
      console.error(err);
      showToast("Check Out Failed", "error");
    }
  };

  const updateTargetStatus = async (newStatus) => {
    if (!target) return;

    try {
      await API.put(`/api/employee/target-status/${target.id}`, {
        status: newStatus,
      });

      showToast(`Work status updated to ${newStatus}!`);
      setTarget({ ...target, status: newStatus });
    } catch (err) {
      console.error(err);
      showToast("Failed to update status", "error");
    }
  };

  if (!user) {
    return (
      <div style={{ padding: "60px", textAlign: "center", color: "var(--text-muted)" }}>
        <h2>Loading Employee Portal...</h2>
      </div>
    );
  }

  return (
    <div className="employee-page fade-in">
      {/* Toast Notification Banner */}
      {toast && (
        <div className={`toast-msg toast-${toast.type}`}>
          <AlertCircle size={18} />
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header Brand Bar */}
      <header className="admin-header" style={{ marginBottom: "24px" }}>
        <div className="brand-container">
          <div className="brand-logo-box" style={{ background: "transparent", border: "none" }}>
            <img src="/codingity-logo.png" alt="Codingity Logo" className="brand-logo-img" style={{ width: "44px", height: "44px", objectFit: "contain" }} />
          </div>
          <div className="brand-info">
            <h1>Codingity Portal</h1>
            <p>Employee Attendance & Workforce Hub</p>
          </div>
        </div>
      </header>

      {/* Header Profile Card */}
      <div className="emp-header-card">
        <div className="emp-profile-wrapper">
          {user.photo_url ? (
            <img src={user.photo_url} alt={user.name} className="emp-avatar" />
          ) : (
            <div className="emp-avatar-placeholder">
              {user.name ? user.name.charAt(0).toUpperCase() : "E"}
            </div>
          )}

          <div className="emp-info">
            <h1>Welcome back, {user.name} 👋</h1>
            <p>{user.email}</p>
            <div className="emp-badges">
              {user.designation && (
                <span className="emp-badge-item">{user.designation}</span>
              )}
              {user.employee_id && (
                <span className="emp-badge-item">ID: {user.employee_id}</span>
              )}
              <span className="emp-badge-item" style={{ color: "#818cf8" }}>
                Role: {user.role}
              </span>
            </div>
          </div>
        </div>

        <div className="emp-header-actions">
          <button
            className={`btn-secondary ${activeTab === "history" ? "active" : ""}`}
            onClick={() =>
              setActiveTab(activeTab === "dashboard" ? "history" : "dashboard")
            }
          >
            <Calendar size={18} />
            <span>{activeTab === "dashboard" ? "Attendance History" : "Dashboard View"}</span>
          </button>

          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {activeTab === "dashboard" && (
        <div className="dashboard-content fade-in">
          {/* Main Grid */}
          <div className="dashboard-grid">
            {/* Live Clock & Shift Times Card */}
            <div className="portal-card">
              <div>
                <div className="card-top-icon purple">
                  <Clock size={24} />
                </div>
                <div className="card-title">Live Time & Location</div>
                <div className="live-time-display">{currentTime || "00:00:00 AM"}</div>
                <div className="live-date-display">{currentDate}</div>
              </div>

              <div
                style={{
                  marginTop: "20px",
                  paddingTop: "16px",
                  borderTop: "1px solid var(--border-subtle)",
                  fontSize: "0.825rem",
                  color: "var(--text-dim)",
                }}
              >
                <span>Check-in Window: 9:55 AM - 10:30 AM (IST)</span>
              </div>
            </div>

            {/* Attendance Action Card */}
            <div className="portal-card">
              <div>
                <div className="card-top-icon emerald">
                  <UserCheck size={24} />
                </div>
                <div className="card-title">Today's Attendance</div>

                <div style={{ margin: "14px 0" }}>
                  <span
                    className={`status-badge-large badge badge-${
                      attendanceStatus.includes("Checked In")
                        ? "present"
                        : attendanceStatus.includes("Checked Out")
                        ? "fullday"
                        : "pending"
                    }`}
                  >
                    {attendanceStatus}
                  </span>
                </div>
              </div>

              <div className="action-buttons-group">
                <button
                  className="checkin-btn"
                  onClick={handleCheckIn}
                  disabled={
                    attendanceStatus === "Checked In ✅" ||
                    attendanceStatus === "Checked Out ✅"
                  }
                >
                  <MapPin size={18} />
                  <span>Check In</span>
                </button>

                <button
                  className="checkout-btn"
                  onClick={handleCheckOut}
                  disabled={attendanceStatus !== "Checked In ✅"}
                >
                  <LogOut size={18} />
                  <span>Check Out</span>
                </button>
              </div>
            </div>

            {/* Assigned Work Card */}
            <div className="portal-card" style={{ gridColumn: "1 / -1" }}>
              <div>
                <div className="card-top-icon cyan">
                  <Briefcase size={24} />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div className="card-title">Assigned Work / Today's Target</div>
                  {target && (
                    <span
                      className={`badge badge-${
                        target.status === "Completed"
                          ? "completed"
                          : target.status === "In Progress"
                          ? "in-progress"
                          : "pending"
                      }`}
                    >
                      {target.status || "Pending"}
                    </span>
                  )}
                </div>

                <div className="task-content-box">
                  {target?.target_text ? (
                    <div>
                      <div className="task-text">{target.target_text}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
                        Assigned Date: {target.target_date || "Today"}
                      </div>
                    </div>
                  ) : (
                    <div style={{ color: "var(--text-dim)", textAlign: "center", padding: "10px" }}>
                      No tasks assigned by Admin for today.
                    </div>
                  )}
                </div>
              </div>

              {target && (
                <div className="task-actions-row">
                  {target.status !== "In Progress" && target.status !== "Completed" && (
                    <button
                      className="btn-status-progress"
                      onClick={() => updateTargetStatus("In Progress")}
                    >
                      <PlayCircle size={16} />
                      <span>Start Work (In Progress)</span>
                    </button>
                  )}

                  {target.status !== "Completed" && (
                    <button
                      className="btn-status-done"
                      onClick={() => updateTargetStatus("Completed")}
                    >
                      <CheckCircle2 size={16} />
                      <span>Mark Work Completed</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="history-content fade-in">
          <div className="content-card">
            <div className="card-header-bar">
              <div className="card-title-group">
                <Calendar size={22} className="brand-icon" />
                <h2>My Attendance History</h2>
              </div>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Status</th>
                    <th>Coordinates</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center", color: "var(--text-dim)" }}>
                        No attendance history found.
                      </td>
                    </tr>
                  ) : (
                    history.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.date}</strong>
                        </td>
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
                            {item.status}
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
                              <span>
                                {parseFloat(item.latitude).toFixed(4)}, {parseFloat(item.longitude).toFixed(4)}
                              </span>
                            </a>
                          ) : (
                            "-"
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
    </div>
  );
}