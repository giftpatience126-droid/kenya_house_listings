import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdBanner from "../components/AdBanner";
import { addProductApi, getFriendlyApiErrorMessage, isRecoverableApiError, mpesaPaymentApi, verifyListingPaymentApi } from "../utils/api";
import { findUserByEmail, getSession, isPremiumSession, hasPaidListingFee, setListingFeePaid } from "../utils/auth";
import { saveCustomListing } from "../utils/listings";
import "./Auth.css";

const LISTING_FEE = 30;
const CATEGORY_OPTIONS = [
  { value: "home", label: "Home" },
  { value: "airbnb", label: "Airbnb" },
  { value: "hotel", label: "Hotel" },
  { value: "restaurant", label: "Restaurant" }
];

function AddProperty() {
  const navigate = useNavigate();
  const storedSession = getSession();
  const storedUser = findUserByEmail(storedSession?.email);
  const session = storedSession
    ? { ...storedSession, phone: storedSession.phone || storedUser?.phone || "" }
    : null;
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    location: "",
    category: "home",
    imageUrl: "",
    adminPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [sendingListingPrompt, setSendingListingPrompt] = useState(false);
  const hasPaidFee = hasPaidListingFee(session);
  const isPremium = isPremiumSession(session);
  const canSubmit = isPremium || hasPaidFee;
  const listingTag = useMemo(
    () => (isPremium ? "Premium" : "New"),
    [isPremium]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSendListingPrompt = async () => {
    if (!session?.phone) {
      setError("Your seller account does not have a saved phone number. Update the account or register again with a phone number.");
      return;
    }

    setSendingListingPrompt(true);
    setError("");
    setPaymentStatus(`Sending Ksh ${LISTING_FEE} M-Pesa prompt to ${session.phone}...`);

    try {
      await mpesaPaymentApi({
        phone: session.phone,
        amount: LISTING_FEE,
        email: session.email,
        account_reference: "Listing Fee",
        transaction_desc: "Kenya House Listings listing fee"
      });
      setPaymentStatus(`M-Pesa prompt sent to ${session.phone}. Complete it, then verify your transaction ID below.`);
    } catch (apiError) {
      setPaymentStatus("");
      setError(getFriendlyApiErrorMessage(apiError, "Could not send the listing payment prompt."));
    } finally {
      setSendingListingPrompt(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!transactionId.trim()) {
      setError("Please enter a valid transaction ID.");
      return;
    }

    setVerifyingPayment(true);
    setError("");
    setPaymentStatus("Verifying payment...");

    try {
      await verifyListingPaymentApi({
        email: session.email,
        transactionId: transactionId,
        phone: session.phone,
        amount: String(LISTING_FEE)
      });
      setListingFeePaid();
      setPaymentStatus("Payment verified! You can now add listings.");
      setTransactionId("");
    } catch (apiError) {
      setError(apiError.message || "Payment verification failed.");
      setPaymentStatus("");
    } finally {
      setVerifyingPayment(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!canSubmit) {
      setLoading(false);
      setError("Pay and verify the Ksh 30 listing fee before publishing this listing.");
      return;
    }

    if (form.adminPassword !== session.sellerAdminPassword) {
      setLoading(false);
      setError("Seller admin password is incorrect.");
      return;
    }

    const listing = {
      id: `${form.category}-${Date.now()}`,
      title: form.title.trim(),
      description: form.description.trim(),
      price: form.price.trim(),
      location: form.location.trim(),
      category: form.category,
      tag: listingTag,
      sellerEmail: session.email,
      sellerName: session.name,
      sellerPhone: session.phone,
      imageUrl: form.imageUrl.trim() || "https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?auto=format&fit=crop&w=900&q=80"
    };

    const formData = new FormData();
    formData.append("product_name", listing.title);
    formData.append("product_description", listing.description);
    formData.append("product_cost", listing.price);
    formData.append("category", listing.category);
    formData.append("location", listing.location);
    formData.append("seller_name", listing.sellerName);
    formData.append("seller_email", listing.sellerEmail);
    formData.append("product_photo_url", listing.imageUrl);

    try {
      await addProductApi(formData);
    } catch (apiError) {
      if (!isRecoverableApiError(apiError)) {
        setLoading(false);
        setError(getFriendlyApiErrorMessage(apiError, "Could not publish the listing."));
        return;
      }
    }

    saveCustomListing(listing);
    setSuccess("Listing published successfully and added to the marketplace.");
    setForm({
      title: "",
      description: "",
      price: "",
      location: "",
      category: "home",
      imageUrl: "",
      adminPassword: ""
    });
    setLoading(false);
  };

  if (!session || session.role !== "seller") {
    return (
      <div className="auth-page">
        <div className="auth-shell">
          <section className="auth-card">
            <h2>Seller access only</h2>
            <p>Login as a seller to add homes, hotels, restaurants, or airbnbs.</p>
            <div className="auth-actions">
              <button type="button" onClick={() => navigate("/login", { state: { redirectTo: "/add" } })}>
                Login as seller
              </button>
              <button type="button" onClick={() => navigate("/")}>
                Back home
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <AdBanner position="top" />
        <div className="auth-container">
          <div className="auth-header">
            <h1>Add Property</h1>
            <p>List your property for thousands of buyers to discover.</p>
          </div>

          {!isPremium && !hasPaidFee && (
            <div className="auth-notice" style={{ backgroundColor: '#fff3cd', border: '1px solid #ffc107', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
              <h3 style={{ color: '#856404', margin: '0 0 8px 0' }}>📋 Listing Fee Required</h3>
              <p style={{ color: '#856404', margin: '0', lineHeight: '1.5' }}>
                Free accounts must pay a <strong>Ksh 30</strong> listing fee before adding properties.
              </p>
              
              <div style={{ backgroundColor: '#f8f9fa', padding: '12px', borderRadius: '6px', marginTop: '12px' }}>
                <h4 style={{ color: '#495057', margin: '0 0 8px 0' }}>Option 1: Pay with M-Pesa</h4>
                <p style={{ color: '#6c757d', margin: '0 0 8px 0', fontSize: '14px' }}>
                  Complete the payment flow below, then enter your transaction ID to verify.
                </p>
                
                <button
                  type="button"
                  onClick={handleSendListingPrompt}
                  disabled={sendingListingPrompt}
                  style={{ backgroundColor: '#28a745', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                  {sendingListingPrompt ? 'Sending Prompt...' : 'Pay Ksh 30 with M-Pesa'}
                </button>
              </div>
              
              <div style={{ backgroundColor: '#f8f9fa', padding: '12px', borderRadius: '6px', marginTop: '12px' }}>
                <h4 style={{ color: '#495057', margin: '0 0 8px 0' }}>Option 2: Verify Payment</h4>
                <p style={{ color: '#6c757d', margin: '0 0 8px 0', fontSize: '14px' }}>
                  Already paid? Enter your M-Pesa transaction ID to verify.
                </p>
                
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Enter M-Pesa transaction ID"
                    style={{ flex: 1, padding: '8px', border: '1px solid #ced4da', borderRadius: '4px' }}
                  />
                  <button
                    type="button"
                    onClick={handleVerifyPayment}
                    disabled={verifyingPayment}
                    style={{ backgroundColor: '#28a745', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    {verifyingPayment ? 'Verifying...' : 'Verify Payment'}
                  </button>
                </div>
              </div>
            </div>
          )}
          {paymentStatus && (
            <div className="auth-status auth-status--info" style={{ marginBottom: '16px' }}>
              {paymentStatus}
            </div>
          )}
          <p>
            Create homes, airbnbs, hotels, and restaurants from one form. Your seller
            admin password is required before a listing can be submitted.
          </p>

          {loading && (
            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#e2e3e5', borderRadius: '8px' }}>
              Processing request...
            </div>
          )}

          {error && (
            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '8px' }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '8px' }}>
              {success}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="listing-title">Listing title</label>
            <input
              id="listing-title"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g. Kilimani executive apartment"
              required
            />

            <label htmlFor="listing-description">Description</label>
            <textarea
              id="listing-description"
              name="description"
              rows={4}
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the property, amenities, meals, or stay experience."
              required
            />

            <label htmlFor="listing-price">Price</label>
            <input
              id="listing-price"
              name="price"
              value={form.price}
              onChange={handleChange}
              placeholder="e.g. Ksh 25,000 / month"
              required
            />

            <label htmlFor="listing-location">Location</label>
            <input
              id="listing-location"
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="e.g. Westlands"
              required
            />

            <label htmlFor="listing-category">Category</label>
            <select
              id="listing-category"
              name="category"
              value={form.category}
              onChange={handleChange}
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <label htmlFor="listing-image">Image URL</label>
            <input
              id="listing-image"
              name="imageUrl"
              type="url"
              value={form.imageUrl}
              onChange={handleChange}
              placeholder="https://..."
            />

            <label htmlFor="seller-admin-password-confirm">Seller admin password</label>
            <input
              id="seller-admin-password-confirm"
              name="adminPassword"
              type="password"
              value={form.adminPassword}
              onChange={handleChange}
              placeholder="Enter your seller admin password"
              required
            />

            <div className="auth-actions">
              <button type="submit" disabled={loading || !canSubmit}>
                {loading ? "Publishing listing..." : "Publish Listing"}
              </button>
              <button type="button" onClick={() => navigate("/dashboard")}>
                Back to Dashboard
              </button>
            </div>
          </form>

          <section className="auth-hero">
            <div className="auth-hero__bullets">
              <span>Every listing sends a Ksh 30 M-Pesa prompt before publish</span>
              <span>{isPremium ? "Premium seller account: ad-light experience and premium badge" : "Free seller account: essential listing workflow"}</span>
              <span>Listings are linked to your seller dashboard and bookings</span>
            </div>
          </section>
        </div>
        <AdBanner position="bottom" />
      </div>
    </div>
  );
}

export default AddProperty;
