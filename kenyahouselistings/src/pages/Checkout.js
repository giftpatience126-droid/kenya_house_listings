import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createReservationApi,
  getFriendlyApiErrorMessage,
  isRecoverableApiError,
  mpesaPaymentApi,
  verifyListingPaymentApi,
  saveCartApi
} from "../utils/api";
import { getSession } from "../utils/auth";
import { clearCart, getCartItems } from "../utils/cart";
import { saveReservation } from "../utils/reservations";
import "./Checkout.css";

function Checkout() {
  const navigate = useNavigate();
  const session = getSession();
  const [items, setItems] = useState(() => getCartItems());
  const [form, setForm] = useState({
    fullName: session?.name || "",
    email: session?.email || "",
    phone: session?.phone || "",
    guests: "1",
    reservationDate: "",
    notes: "",
    paymentMethod: "mpesa",
    mpesaPhone: "",
    bankName: "",
    accountName: "",
    accountNumber: "",
    bankReference: "",
    cardName: "",
    cardNumber: "",
    expiry: "",
    cvv: ""
  });
  const [transactionId, setTransactionId] = useState("");
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [promptSent, setPromptSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [completionNote, setCompletionNote] = useState("");

  const totalValue = useMemo(() => {
    return items.reduce((sum, item) => {
      const value = Number(String(item.price).replace(/[^\d.]/g, ""));
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);
  }, [items]);

  const totalLabel = useMemo(
    () => `Ksh ${totalValue.toLocaleString()}`,
    [totalValue]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handlePlaceOrder = async (event) => {
    event.preventDefault();
    if (items.length === 0 || !session) {
      return;
    }

    setLoading(true);
    setError("");
    setStatus("");

    if (!form.fullName || !form.email || !form.phone) {
      setLoading(false);
      setError("Full name, email, and phone number are required.");
      return;
    }

    const mpesaPhone = normalizeKenyanPhone(form.mpesaPhone || form.phone);

    if (form.paymentMethod === "mpesa" && !mpesaPhone) {
      setLoading(false);
      setError("Enter a valid Safaricom number such as 07XXXXXXXX or 2547XXXXXXXX.");
      return;
    }

    const paymentDetails = buildPaymentDetails(form);
    const reservationPayload = {
      buyerName: form.fullName,
      buyerEmail: form.email,
      buyerPhone: form.phone,
      guests: form.guests,
      reservationDate: form.reservationDate,
      notes: form.notes,
      paymentMethod: form.paymentMethod,
      paymentDetails,
      amount: totalValue,
      amountLabel: totalLabel,
      items
    };
    const syncWarnings = [];

    try {
      setStatus("Saving your cart...");
      try {
        await saveCartApi({
          buyerEmail: form.email,
          buyerName: form.fullName,
          items
        });
      } catch (apiError) {
        if (isRecoverableApiError(apiError)) {
          syncWarnings.push("Cart sync is temporarily unavailable, but your reservation can still continue.");
        } else {
          throw apiError;
        }
      }

      if (form.paymentMethod === "mpesa" && !paymentVerified) {
        setStatus("Sending M-Pesa prompt...");
        try {
          await mpesaPaymentApi({
            phone: mpesaPhone,
            amount: totalValue,
            email: form.email,
            account_reference: items[0]?.title || "Reservation",
            transaction_desc: `Reservation for ${items.length} listing(s)`
          });
          setPromptSent(true);
          setStatus(`M-Pesa prompt sent to ${mpesaPhone}. Complete it on your phone, then enter the transaction ID to place the reservation.`);
          setLoading(false);
          return;
        } catch (apiError) {
          throw apiError;
        }
      }

      setStatus("Submitting reservation...");
      try {
        await createReservationApi(reservationPayload);
      } catch (apiError) {
        if (isRecoverableApiError(apiError)) {
          syncWarnings.push("Reservation sync is temporarily unavailable, so the reservation was saved locally on this device.");
        } else {
          throw apiError;
        }
      }
    } catch (apiError) {
      setLoading(false);
      setStatus("");
      setError(getFriendlyApiErrorMessage(apiError, "Reservation could not be submitted."));
      return;
    }

    items.forEach((item) => {
      saveReservation({
        id: `${item.id}-${Date.now()}`,
        listingId: item.id,
        listingTitle: item.title,
        sellerEmail: item.sellerEmail,
        sellerName: item.sellerName,
        sellerPhone: item.sellerPhone || "",
        buyerName: form.fullName,
        buyerEmail: form.email,
        buyerPhone: form.phone,
        paymentMethod: form.paymentMethod,
        paymentDetails,
        reservationDate: form.reservationDate,
        guests: form.guests,
        amount: item.price,
        status: "Pending confirmation",
        createdAt: new Date().toISOString()
      });
    });

    clearCart();
    setItems([]);
    setOrderPlaced(true);
    setCompletionNote(
      [
        form.paymentMethod === "mpesa"
          ? syncWarnings.some((warning) => warning.includes("M-Pesa prompt service"))
            ? `Your reservation was saved, but the M-Pesa prompt service is unavailable right now for ${mpesaPhone}.`
            : `An M-Pesa prompt was sent to ${mpesaPhone}. Complete the payment on your phone if you have not done so yet.`
          : "Your reservation has been submitted successfully.",
        ...syncWarnings
      ].join(" ")
    );
    setStatus("");
    setLoading(false);
  };

  const handleVerifyPayment = async () => {
    const mpesaPhone = normalizeKenyanPhone(form.mpesaPhone || form.phone);

    if (!transactionId.trim()) {
      setError("Enter the M-Pesa transaction ID after completing the phone prompt.");
      return;
    }

    setLoading(true);
    setError("");
    setStatus("Verifying payment...");

    try {
      await verifyListingPaymentApi({
        email: form.email,
        transactionId,
        phone: mpesaPhone,
        amount: totalValue
      });
      setPaymentVerified(true);
      setStatus("Payment verified. Submit again to place the reservation.");
    } catch (apiError) {
      setStatus("");
      setError(getFriendlyApiErrorMessage(apiError, "Payment verification failed."));
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="checkout-page">
        <div className="checkout-shell">
          <section className="checkout-empty">
            <h2>Login required</h2>
            <p>Sign in before sending reservations or payment details.</p>
            <button
              type="button"
              onClick={() => navigate("/login", { state: { redirectTo: "/checkout" } })}
            >
              Login
            </button>
          </section>
        </div>
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div className="checkout-page">
        <div className="checkout-shell">
          <section className="checkout-success">
            <p className="checkout-success__eyebrow">Reservation sent</p>
            <h1>Checkout complete</h1>
            <p>
              Your reservation and payment flow were submitted, and your dashboard now
              tracks the booking.
            </p>
            {completionNote && <p>{completionNote}</p>}
            <div className="checkout-success__actions">
              <button type="button" onClick={() => navigate("/")}>
                Back to Marketplace
              </button>
              <button type="button" onClick={() => navigate("/dashboard")}>
                Open Dashboard
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-shell">
        <header className="checkout-header">
          <div>
            <p className="checkout-header__eyebrow">Checkout</p>
            <h1>Reserve your selected listings</h1>
            <p>Provide your reservation details and choose the right payment flow.</p>
          </div>
          <button type="button" onClick={() => navigate("/cart")}>
            Back to Cart
          </button>
        </header>

        {items.length === 0 ? (
          <section className="checkout-empty">
            <h2>No items in cart</h2>
            <p>Add listings before checking out.</p>
            <button type="button" onClick={() => navigate("/")}>
              Go to Marketplace
            </button>
          </section>
        ) : (
          <main className="checkout-content">
            <section className="checkout-summary">
              <h2>Reservation summary</h2>
              <div className="checkout-summary__list">
                {items.map((item) => (
                  <article key={item.id} className="checkout-item">
                    <img src={item.imageUrl} alt={item.title} />
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.location} | {item.category}</p>
                      <strong>{item.price}</strong>
                    </div>
                  </article>
                ))}
              </div>
              <div className="checkout-summary__total">
                <span>Total</span>
                <strong>{totalLabel}</strong>
              </div>
            </section>

            <section className="checkout-form-card">
              <h2>Buyer and payment details</h2>
              <form onSubmit={handlePlaceOrder}>
                {status && <div className="checkout-form-card__status">{status}</div>}
                {error && <div className="checkout-form-card__alert">{error}</div>}

                <label htmlFor="full-name">Full name</label>
                <input
                  id="full-name"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  required
                />

                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />

                <label htmlFor="phone">Phone number</label>
                <input
                  id="phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                />

                <label htmlFor="guests">Guests or party size</label>
                <input
                  id="guests"
                  name="guests"
                  value={form.guests}
                  onChange={handleChange}
                  required
                />

                <label htmlFor="reservation-date">Preferred reservation date</label>
                <input
                  id="reservation-date"
                  name="reservationDate"
                  type="date"
                  value={form.reservationDate}
                  onChange={handleChange}
                />

                <label htmlFor="payment-method">Preferred payment method</label>
                <select
                  id="payment-method"
                  name="paymentMethod"
                  value={form.paymentMethod}
                  onChange={handleChange}
                >
                  <option value="mpesa">M-Pesa prompting</option>
                  <option value="bank">Bank transfer</option>
                  <option value="card">Card payment</option>
                </select>

                {form.paymentMethod === "mpesa" && (
                  <>
                    <label htmlFor="mpesa-phone">M-Pesa phone number</label>
                    <input
                      id="mpesa-phone"
                      name="mpesaPhone"
                      value={form.mpesaPhone}
                      onChange={handleChange}
                      required
                      placeholder="07XXXXXXXX or 2547XXXXXXXX"
                    />
                    <p className="checkout-form-card__hint">
                      The reservation is placed only after you complete and verify the M-Pesa prompt.
                    </p>
                    {(promptSent || status.includes("prompt sent")) && !paymentVerified && (
                      <div className="checkout-form-card__verify">
                        <label htmlFor="mpesa-transaction-id">M-Pesa transaction ID</label>
                        <input
                          id="mpesa-transaction-id"
                          value={transactionId}
                          onChange={(event) => setTransactionId(event.target.value)}
                          placeholder="e.g. QAB12CDE34"
                        />
                        <button type="button" onClick={handleVerifyPayment} disabled={loading}>
                          {loading ? "Verifying..." : "Verify Payment"}
                        </button>
                      </div>
                    )}
                    {paymentVerified && (
                      <div className="checkout-form-card__status">
                        Payment verified. You can now submit the reservation.
                      </div>
                    )}
                  </>
                )}

                {form.paymentMethod === "bank" && (
                  <>
                    <label htmlFor="bank-name">Bank name</label>
                    <input
                      id="bank-name"
                      name="bankName"
                      value={form.bankName}
                      onChange={handleChange}
                      required
                    />

                    <label htmlFor="account-name">Account name</label>
                    <input
                      id="account-name"
                      name="accountName"
                      value={form.accountName}
                      onChange={handleChange}
                      required
                    />

                    <label htmlFor="account-number">Account number</label>
                    <input
                      id="account-number"
                      name="accountNumber"
                      value={form.accountNumber}
                      onChange={handleChange}
                      required
                    />

                    <label htmlFor="bank-reference">Transfer reference</label>
                    <input
                      id="bank-reference"
                      name="bankReference"
                      value={form.bankReference}
                      onChange={handleChange}
                      required
                    />
                  </>
                )}

                {form.paymentMethod === "card" && (
                  <>
                    <label htmlFor="card-name">Cardholder name</label>
                    <input
                      id="card-name"
                      name="cardName"
                      value={form.cardName}
                      onChange={handleChange}
                      required
                    />

                    <label htmlFor="card-number">Card number</label>
                    <input
                      id="card-number"
                      name="cardNumber"
                      value={form.cardNumber}
                      onChange={handleChange}
                      required
                    />

                    <label htmlFor="expiry">Expiry date</label>
                    <input
                      id="expiry"
                      name="expiry"
                      value={form.expiry}
                      onChange={handleChange}
                      required
                    />

                    <label htmlFor="cvv">CVV</label>
                    <input
                      id="cvv"
                      name="cvv"
                      value={form.cvv}
                      onChange={handleChange}
                      required
                    />
                  </>
                )}

                <label htmlFor="notes">Additional notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Questions, arrival time, party details, or special requests."
                />

                <button type="submit" disabled={loading}>
                  {loading
                    ? "Processing..."
                    : form.paymentMethod === "mpesa" && !paymentVerified
                      ? "Send M-Pesa Prompt"
                      : "Submit Reservation"}
                </button>
              </form>
            </section>
          </main>
        )}
      </div>
    </div>
  );
}

function buildPaymentDetails(form) {
  if (form.paymentMethod === "mpesa") {
    return {
      mpesaPhone: normalizeKenyanPhone(form.mpesaPhone || form.phone)
    };
  }

  if (form.paymentMethod === "bank") {
    return {
      bankName: form.bankName,
      accountName: form.accountName,
      accountNumber: form.accountNumber,
      bankReference: form.bankReference
    };
  }

  return {
    cardName: form.cardName,
    cardNumber: form.cardNumber,
    expiry: form.expiry,
    cvv: form.cvv
  };
}

function normalizeKenyanPhone(value) {
  const digits = String(value || "").replace(/[^\d+]/g, "").trim();

  if (!digits) {
    return "";
  }

  if (digits.startsWith("+254")) {
    return digits.slice(1);
  }

  if (digits.startsWith("254") && digits.length === 12) {
    return digits;
  }

  if (digits.startsWith("0") && digits.length === 10) {
    return `254${digits.slice(1)}`;
  }

  if (digits.startsWith("7") && digits.length === 9) {
    return `254${digits}`;
  }

  return "";
}

export default Checkout;
