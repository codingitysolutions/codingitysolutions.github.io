import { useEffect, useState } from "react";
import { API } from "../services/api";
import { useNavigate } from "react-router-dom";
import { Calendar, ArrowLeft, MapPin } from "lucide-react";
import "./AdminDashboard.css";

export default function AttendanceHistory() {
  const [attendance, setAttendance] = useState([]);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    setUser(savedUser);

    if (savedUser) {
      loadAttendance(savedUser.id);
    }
  }, []);

  const loadAttendance = async (employeeId) => {
    try {
      const res = await API.get(`/api/attendance/history/${employeeId}`);
      setAttendance(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="admin-page fade-in">
      <div className="admin-header">
        <div className="brand-container">
          <button
            className="btn-secondary"
            onClick={() => navigate(user?.role === "admin" ? "/admin" : "/employee")}
          >
            <ArrowLeft size={18} />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>

      <div className="content-card">
        <div className="card-header-bar">
          <div className="card-title-group">
            <Calendar size={22} className="brand-icon" />
            <h2>Attendance Log History</h2>
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
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {attendance.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", color: "var(--text-dim)" }}>
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                attendance.map((item) => (
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
  );
}