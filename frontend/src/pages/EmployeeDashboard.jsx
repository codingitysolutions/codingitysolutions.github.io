import { useEffect, useState } from "react";
import { API } from "../services/api";
import "./EmployeeDashboard.css";
import { useNavigate } from "react-router-dom";

export default function EmployeeDashboard() {
  const [user, setUser] = useState(null);

  const [attendanceStatus, setAttendanceStatus] =
    useState("Not Checked In");

  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = JSON.parse(
      localStorage.getItem("user")
    );

    const savedStatus =
      localStorage.getItem("attendanceStatus");

    setUser(savedUser);

    if (savedStatus) {
      setAttendanceStatus(savedStatus);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/");
  };

  const handleCheckIn = () => {
    if (!user) return;

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await API.post(
            "/api/attendance/checkin",
            {
              employeeId: user.id,
              latitude:
                position.coords.latitude,
              longitude:
                position.coords.longitude,
            }
          );

          alert("Check In Successful");

          setAttendanceStatus(
            "Checked In ✅"
          );

          localStorage.setItem(
            "attendanceStatus",
            "Checked In ✅"
          );
        } catch (err) {
          console.log(err);
          alert("Already Checked In");
        }
      },

      (error) => {
        console.log(error);

        if (error.code === 1) {
          alert(
            "Location Permission Denied"
          );
        } else if (error.code === 2) {
          alert(
            "Location Unavailable"
          );
        } else if (error.code === 3) {
          alert(
            "Location Request Timed Out"
          );
        } else {
          alert(
            "Unable to Get Location"
          );
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
    try {
      await API.post(
        "/api/attendance/checkout",
        {
          employeeId: user.id,
        }
      );

      alert("Check Out Successful");

      setAttendanceStatus(
        "Checked Out ✅"
      );

      localStorage.setItem(
        "attendanceStatus",
        "Checked Out ✅"
      );
    } catch (err) {
      alert("Check Out Failed");
    }
  };

  if (!user)
    return <h2>Loading...</h2>;

  return (
    <div className="employee-page">

      <div className="hero-card">
        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            width: "100%",
          }}
        >
          <div>
            <h1>
              Codingity Attendance
              System
            </h1>

            <p>
              Smart Employee
              Attendance &
              Workforce
              Management
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="logout-btn"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="employee-card">
        <h2>Employee Details</h2>

        <h3>{user.name}</h3>

        <p>{user.email}</p>

        <p>{user.designation}</p>
      </div>

      <div className="status-card">
        <h2>
          Today's Attendance
        </h2>

        <h3>
          {attendanceStatus}
        </h3>
      </div>

      <div className="action-card">
        <button
          className="checkin-btn"
          onClick={handleCheckIn}
          disabled={
            attendanceStatus ===
            "Checked In ✅"
          }
        >
          Check In
        </button>

        <button
          className="checkout-btn"
          onClick={handleCheckOut}
          disabled={
            attendanceStatus ===
            "Checked Out ✅"
          }
        >
          Check Out
        </button>
      </div>

    </div>
  );
}