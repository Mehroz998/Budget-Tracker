import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { LogIn, Eye, EyeClosed } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", { email, password });
      if (response.data.success) {
        localStorage.setItem(
          "accessToken",
          response.data.data.tokens.accessToken,
        );
        localStorage.setItem(
          "refreshToken",
          response.data.data.tokens.refreshToken,
        );
        navigate("/");
        console.log("Response : ", response);
      }
    } catch (err) {
      console.log("error : ", err);
      setError(err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="glass-panel auth-card">
        <h2 className="auth-title">Welcome Back</h2>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input box-none"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="customPassword">
              <input
                type={showPassword ? "text" : "password"}
                className="form-input b-none box-none"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 back-none px-8 cursor-pointer"
              >
                {showPassword ? (
                  <Eye size={20} color="rgba(0, 0, 0, 0.2)" />
                ) : (
                  <EyeClosed size={20} color="rgba(0, 0, 0, 0.2)" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary w-full mt-4"
            disabled={loading}
          >
            <LogIn size={20} />
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="auth-link">
          Don't have an account? <Link to="/register">Create one here</Link>
        </div>
      </div>
    </div>
  );
}
