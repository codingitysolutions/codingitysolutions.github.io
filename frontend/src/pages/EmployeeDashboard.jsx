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

  setUser(savedUser);

  if (savedUser) {
    loadTodayAttendance(savedUser.id);
  }
}, []);

const loadTodayAttendance = async (employeeId) => {
  try {
    const res = await API.get(
      `/api/attendance/history/${employeeId}`
    );

    const today = new Date().toLocaleDateString(
  "en-CA"
);

    const todayRecord = res.data.data.find(
      (item) => item.date === today
    );

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
    console.log(err);
  }
};

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
        const res = await API.post(
          "/api/attendance/checkin",
          {
            employeeId: user.id,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }
        );

        alert(
          res?.data?.message ||
          "Check In Successful"
        );

        loadTodayAttendance(user.id);

      } catch (err) {
        console.log(err);

        alert(
          err?.response?.data?.message ||
          "Check In Failed"
        );
      }
    },

    (error) => {
      console.log(error);

      if (error.code === 1) {
        alert(
          "Location Permission Denied. Please allow location access."
        );
      } else if (error.code === 2) {
        alert(
          "Location Unavailable. Please turn ON GPS and try again."
        );
      } else if (error.code === 3) {
        alert(
          "Location Request Timed Out. Try again."
        );
      } else {
        alert(
          "Location is mandatory for attendance."
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

      loadTodayAttendance(user.id);
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
              <br />
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
  attendanceStatus === "Checked In ✅" ||
  attendanceStatus === "Checked Out ✅"
}
        >
          Check In
        </button>

        <button
          className="checkout-btn"
          onClick={handleCheckOut}
         disabled={
  attendanceStatus !== "Checked In ✅"
}
        >
          Check Out
        </button>
      </div>

    </div>
  );
}