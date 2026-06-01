import { useState } from "react";
import { API } from "../services/api";
import { useNavigate } from "react-router-dom";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await API.post("/api/auth/login", {
        email,
        password,
      });

      localStorage.setItem(
        "token",
        res.data.token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(res.data.user)
      );

      if (res.data.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/employee");
      }
    } catch (err) {
      alert("Login Failed");
    }
  };

  return (
    <div className="login-page">

      <div className="login-card">

        <img
          src="/codingity-logo.png"
          alt="Codingity"
          className="logo"
        />

        <h1>Attendance Portal</h1>

        <p>
          Secure Employee Attendance
          Management System
        </p>

        <form onSubmit={handleLogin}>

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            required
          />

          <button type="submit">
            Login to Dashboard
          </button>

        </form>

        <div className="login-badge">
          Secure Employee Portal • Codingity IT Solutions
        </div>

      </div>

    </div>
  );
}