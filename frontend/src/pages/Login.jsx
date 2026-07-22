import { useState } from "react";
import { API } from "../services/api";
import { useNavigate } from "react-router-dom";
import { LogIn, Mail, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await API.post("/api/auth/login", {
        email,
        password,
      });

      if (res.data?.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));

        if (res.data.user.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/employee");
        }
      } else {
        setErrorMsg("Invalid credentials. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(
        err.response?.data?.message || "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card fade-in">
        <div className="logo-wrapper">
          <div className="logo-icon-bg" style={{ background: "transparent", border: "none" }}>
            <img src="/codingity-logo.png" alt="Codingity Logo" className="brand-logo-img" style={{ width: "60px", height: "60px", objectFit: "contain" }} />
          </div>
        </div>

        <h1 className="portal-title">Codingity</h1>
        <p className="portal-subtitle">Smart Workforce & Attendance Portal</p>

        {errorMsg && (
          <div className="toast-msg toast-error">
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <Mail className="input-icon" size={20} />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <Lock className="input-icon" size={20} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? (
              <span>Logging in...</span>
            ) : (
              <>
                <LogIn size={20} />
                <span>Login to Dashboard</span>
              </>
            )}
          </button>
        </form>

        <div className="login-badge">
          <span>Secure Enterprise Portal</span> • Codingity IT Solutions
        </div>
      </div>
    </div>
  );
}