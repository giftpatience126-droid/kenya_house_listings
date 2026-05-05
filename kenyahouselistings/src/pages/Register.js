import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { activatePremiumForEmail, buildSessionFromUser, saveSession, saveUser } from "../utils/auth";
import { getFriendlyApiErrorMessage, isRecoverableApiError, mpesaPaymentApi, signUpApi } from "../utils/api";
import "./Auth.css";

const PREMIUM_PRICE = 100;

function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "buyer",
    plan: "free",
    sellerAdminPassword: "",
    sellerAdminPasswordConfirm: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [status, setStatus] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showSellerPassword, setShowSellerPassword] = useState(false);
  const [showSellerPasswordConfirm, setShowSellerPasswordConfirm] = useState(false);

  const redirectTo = location.state?.redirectTo || "/dashboard";
  const sellerCode = useMemo(
    () => `SELL-${Date.now().toString().slice(-6)}`,
    []
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    setStatus("");

    if (
      form.role === "seller" &&
      form.sellerAdminPassword !== form.sellerAdminPasswordConfirm
    ) {
      setLoading(false);
      setError("Seller admin password confirmation does not match.");
      return;
    }

    const userPayload = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      password: form.password,
      role: form.role,
      plan: form.plan === "premium" ? "free" : form.plan,
      subscriptionStatus: "active",
      sellerAdminPassword: form.role === "seller" ? form.sellerAdminPassword : "",
      sellerCode: form.role === "seller" ? sellerCode : "",
      hasPaidListingFee: false,
      premiumActivatedAt: "",
      premiumTransactionId: ""
    };

    try {
      await signUpApi(userPayload);
    } catch (apiError) {
      if (!isRecoverableApiError(apiError)) {
        setLoading(false);
        setError(getFriendlyApiErrorMessage(apiError, "Signup failed."));
        return;
      }
    }

    saveUser(userPayload);

    if (form.plan === "premium") {
      setStatus(`Sending Ksh ${PREMIUM_PRICE} M-Pesa prompt for Premium activation...`);

      try {
        await mpesaPaymentApi({
          phone: form.phone,
          amount: PREMIUM_PRICE,
          email: form.email,
          account_reference: "Premium Account Activation",
          transaction_desc: "Kenya House Listings Premium signup"
        });
      } catch (apiError) {
        if (!isRecoverableApiError(apiError)) {
          setLoading(false);
          setError(getFriendlyApiErrorMessage(apiError, "Premium payment could not be started."));
          return;
        }
      }

      const activatedUser = activatePremiumForEmail(form.email, {
        transactionId: `PREM-${Date.now()}`,
        activatedAt: new Date().toISOString()
      });

      saveSession(buildSessionFromUser(activatedUser || { ...userPayload, plan: "premium" }));
      setSuccess(
        `Premium account created. A Ksh ${PREMIUM_PRICE} payment prompt has been sent and your Premium access is now active.`
      );
    } else {
      saveSession(buildSessionFromUser(userPayload));
      setSuccess(
        form.role === "seller"
          ? `Seller account created. Your seller code is ${sellerCode}.`
          : "Buyer account created successfully."
      );
    }

    setLoading(false);
    navigate(redirectTo);
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <section className="auth-hero">
          <p className="auth-hero__eyebrow">Create your account</p>
          <h1>Choose buyer or seller and unlock the right tools.</h1>
          <p>
            Buyers can reserve and message sellers. Sellers can add listings, see who
            booked, and manage their incoming leads from one dashboard.
          </p>

          <div className="auth-hero__bullets">
            <span>Free accounts can browse, reserve, and use the marketplace basics</span>
            <span>Premium accounts unlock seller messaging, priority support, and an ad-light experience</span>
            <span>Seller signup includes a private admin password for listing control</span>
            <span>Sellers receive an M-Pesa listing prompt when publishing a new listing</span>
          </div>
        </section>

        <section className="auth-card">
          <h2>Create account</h2>
          <p>Pick the role that matches how you'll use the marketplace.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <div className="auth-status auth-status--error">{error}</div>}
            {success && <div className="auth-status auth-status--success">{success}</div>}
            {status && <div className="auth-status auth-status--info">{status}</div>}

            <label htmlFor="register-name">Full name</label>
            <input
              id="register-name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />

            <label htmlFor="register-email">Email</label>
            <input
              id="register-email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
            />

            <label htmlFor="register-phone">Phone number</label>
            <input
              id="register-phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="07XXXXXXXX or 2547XXXXXXXX"
              required
            />

            <label htmlFor="register-password">Password</label>
            <div className="auth-password-field">
              <input
                id="register-password"
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

            <label htmlFor="register-role">Role</label>
            <select id="register-role" name="role" value={form.role} onChange={handleChange}>
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
            </select>

            <label htmlFor="register-plan">Account plan</label>
            <select id="register-plan" name="plan" value={form.plan} onChange={handleChange}>
              <option value="free">Free</option>
              <option value="premium">Premium
               
              </option>
            </select>

            <div className="auth-plan-card">
              <strong>{form.plan === "premium" ? "Premium account" : "Free account"}</strong>
              <p>
                {form.plan === "premium"
                  ? "Includes secure seller messaging, ad-free browsing, full theme controls, and priority marketplace tools. Premium requires a Ksh 100 payment before your first login."
                  : "Great for browsing, reservations, and getting started before upgrading later."}
              </p>
            </div>

            {form.role === "seller" && (
              <>
                <div className="auth-status auth-status--info">
                  This admin password will be required each time you add a listing.
                </div>

                <label htmlFor="seller-admin-password">Seller admin password</label>
                <div className="auth-password-field">
                  <input
                    id="seller-admin-password"
                    name="sellerAdminPassword"
                    type={showSellerPassword ? "text" : "password"}
                    value={form.sellerAdminPassword}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowSellerPassword((current) => !current)}
                    aria-label={showSellerPassword ? "Hide seller admin password" : "Show seller admin password"}
                    aria-pressed={showSellerPassword}
                  >
                    {showSellerPassword ? "\u{1F648}" : "\u{1F441}"}
                  </button>
                </div>

                <label htmlFor="seller-admin-password-confirm">Confirm admin password</label>
                <div className="auth-password-field">
                  <input
                    id="seller-admin-password-confirm"
                    name="sellerAdminPasswordConfirm"
                    type={showSellerPasswordConfirm ? "text" : "password"}
                    value={form.sellerAdminPasswordConfirm}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowSellerPasswordConfirm((current) => !current)}
                    aria-label={showSellerPasswordConfirm ? "Hide seller admin password confirmation" : "Show seller admin password confirmation"}
                    aria-pressed={showSellerPasswordConfirm}
                  >
                    {showSellerPasswordConfirm ? "\u{1F648}" : "\u{1F441}"}
                  </button>
                </div>
              </>
            )}

            <div className="auth-actions">
              <button type="submit" disabled={loading}>
                {loading ? "Creating account..." : "Register"}
              </button>
              <button type="button" onClick={() => navigate("/")}>
                Continue browsing
              </button>
            </div>
          </form>

          <div className="auth-helper">
            <p>Already have an account?</p>
            <button type="button" onClick={() => navigate("/login", { state: { redirectTo } })}>
              Login
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Register;
