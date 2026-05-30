import { useEffect, useState } from "react";
import { API } from "../services/api";

export default function AttendanceHistory() {
  const [attendance, setAttendance] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = JSON.parse(
      localStorage.getItem("user")
    );

    setUser(savedUser);

    if (savedUser) {
      loadAttendance(savedUser.id);
    }
  }, []);

  const loadAttendance = async (employeeId) => {
    try {
      const res = await API.get(
        `/api/attendance/history/${employeeId}`
      );

      setAttendance(res.data.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div style={{ padding: "30px" }}>
      <h1>Attendance History</h1>

      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Date</th>
            <th>Check In</th>
            <th>Check Out</th>
            <th>Status</th>
            <th>Latitude</th>
            <th>Longitude</th>
          </tr>
        </thead>

        <tbody>
          {attendance.map((item) => (
            <tr key={item.id}>
              <td>{item.date}</td>
              <td>{item.check_in}</td>
              <td>{item.check_out || "-"}</td>
              <td>{item.status}</td>
              <td>{item.latitude}</td>
              <td>{item.longitude}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}