import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { buildSessionFromUser, findUserByEmail, saveSession } from "../utils/auth";
import { getFriendlyApiErrorMessage, signInApi } from "../utils/api";
import "./Auth.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "buyer"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const redirectTo = location.state?.redirectTo || "/dashboard";

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const localUser = findUserByEmail(form.email);

    try {
      if (!localUser) {
        await signInApi({
          email: form.email,
          password: form.password
        });
      }

      const fallbackUser = {
        name: form.email.split("@")[0],
        email: form.email,
        role: localUser?.role || form.role,
        phone: localUser?.phone || "",
        plan: localUser?.plan || "free",
        subscriptionStatus: localUser?.subscriptionStatus || "active",
        sellerAdminPassword: localUser?.sellerAdminPassword || "",
        sellerCode: localUser?.sellerCode || ""
      };

      const userToLogin = localUser || fallbackUser;

      if (userToLogin.plan === "premium" && !userToLogin.premiumActivatedAt) {
        setError("Premium accounts must complete the Ksh 100 payment before login.");
        setLoading(false);
        return;
      }

      saveSession(buildSessionFromUser(userToLogin));
      setLoading(false);
      navigate(redirectTo);
      return;
    } catch (apiError) {
      if (!localUser) {
        setError(getFriendlyApiErrorMessage(apiError, "Login failed. Check your credentials."));
        setLoading(false);
        return;
      }

      if (localUser.password !== form.password) {
        setError("Incorrect password.");
        setLoading(false);
        return;
      }

      if (localUser.plan === "premium" && !localUser.premiumActivatedAt) {
        setError("Premium accounts must complete the Ksh 100 payment before login.");
        setLoading(false);
        return;
      }

      saveSession(buildSessionFromUser(localUser));
      setLoading(false);
      navigate(redirectTo);
      return;
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <section className="auth-hero">
          <p className="auth-hero__eyebrow">Secure access</p>
          <h1>Login</h1>
          <p>
            The marketplace stays public for browsing. Sign in when you want to make a
            reservation, message a seller, manage listings, or make payment.
          </p>

          <div className="auth-hero__bullets">
            <span>Buyer dashboard for reservations, saved items, and premium messaging</span>
            <span>Seller dashboard for bookings, listings, and buyer conversations</span>
            <span>Role-aware checkout with M-Pesa, bank, and card details</span>
          </div>
        </section>

        <section className="auth-card">
          <h2>Welcome back</h2>
          <p>Continue to your buyer or seller dashboard.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <div className="auth-status auth-status--error">{error}</div>}
            {location.state?.reason && (
              <div className="auth-status auth-status--info">{location.state.reason}</div>
            )}

            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
            />

            <label htmlFor="login-password">Password</label>
            <div className="auth-password-field">
              <input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? "\u{1F648}" : "\u{1F441}"}
              </button>
            </div>

            <label htmlFor="login-role">Account role</label>
            <select id="login-role" name="role" value={form.role} onChange={handleChange}>
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
            </select>

            <div className="auth-actions">
              <button type="submit" disabled={loading}>
                {loading ? "Signing in..." : "Login"}
              </button>
              <button type="button" onClick={() => navigate("/")}>
                Continue browsing
              </button>
            </div>
          </form>

          <div className="auth-helper">
            <p>Don't have an account?</p>
            <button type="button" onClick={() => navigate("/register", { state: { redirectTo } })}>
              Sign up
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Login;
