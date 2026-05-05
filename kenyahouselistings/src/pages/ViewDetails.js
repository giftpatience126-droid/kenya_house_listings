import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { addToCart } from "../utils/cart";
import { getSession, isPremiumSession } from "../utils/auth";
import { getMarketplaceListings } from "../utils/listings";
import { getConversationMessages, sendSecureMessage } from "../utils/messages";
import "./ViewDetails.css";

function ViewDetails() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [session] = useState(() => getSession());
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState("");
  const isPremium = isPremiumSession(session);

  const property = useMemo(() => {
    if (state?.property) {
      return state.property;
    }

    return getMarketplaceListings()[0];
  }, [state]);

  useEffect(() => {
    const loadConversation = async () => {
      if (!session || session.email === property.sellerEmail || !isPremium) {
        return;
      }

      const entries = await getConversationMessages(property.id, session.email, property.sellerEmail);
      setMessages(entries);
    };

    loadConversation();
  }, [isPremium, property.id, property.sellerEmail, session]);

  const requireAuth = (redirectTo) => {
    if (!session) {
      navigate("/login", {
        state: {
          redirectTo,
          reason: "Login is required to reserve a listing or message the seller."
        }
      });
      return false;
    }

    return true;
  };

  const handleAddToCart = () => {
    if (!requireAuth("/cart")) {
      return;
    }

    addToCart(property);
    alert("Listing added to cart.");
  };

  const handleReserveNow = () => {
    if (!requireAuth("/checkout")) {
      return;
    }

    addToCart(property);
    navigate("/checkout");
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (!requireAuth("/ViewDetails") || !draft.trim()) {
      return;
    }

    if (!isPremium) {
      setStatus("Upgrade to Premium to message sellers and unlock priority support.");
      return;
    }

    setStatus("Encrypting and sending your message...");

    await sendSecureMessage({
      listingId: property.id,
      senderEmail: session.email,
      senderName: session.name,
      recipientEmail: property.sellerEmail,
      recipientName: property.sellerName,
      text: draft
    });

    const updated = await getConversationMessages(property.id, session.email, property.sellerEmail);
    setMessages(updated);
    setDraft("");
    setStatus("Message sent with client-side encryption.");
  };

  const sellerWhatsappUrl = property.sellerPhone
    ? buildWhatsAppUrl(
        property.sellerPhone,
        `Hello ${property.sellerName}, I am interested in ${property.title} in ${property.location}.`
      )
    : "";

  return (
    <div className="view-details-page">
      <div className="view-details-page__glow view-details-page__glow--one" />
      <div className="view-details-page__glow view-details-page__glow--two" />

      <div className="view-details-shell">
        <header className="view-details-header">
          <p className="view-details-header__eyebrow">{property.category} details</p>
          <h1>{property.title}</h1>
          <p className="view-details-header__copy">
            Review the listing, reserve it, and message the seller from one place.
          </p>
        </header>

        <main className="view-details-content">
          <section className="view-details-media-card">
            <img src={property.imageUrl} alt={property.title} />
          </section>

          <section className="view-details-info-card">
            <div className="view-details-info-row">
              <span>Price</span>
              <strong>{property.price}</strong>
            </div>
            <div className="view-details-info-row">
              <span>Location</span>
              <strong>{property.location}</strong>
            </div>
            <div className="view-details-info-row">
              <span>Category</span>
              <strong>{property.category}</strong>
            </div>
            <div className="view-details-info-row">
              <span>Seller</span>
              <strong>{property.sellerName}</strong>
            </div>
            <div className="view-details-info-row">
              <span>Seller phone</span>
              <strong>{property.sellerPhone || "Available after seller signup"}</strong>
            </div>
            <div className="view-details-description">
              <h2>About this listing</h2>
              <p>{property.description}</p>
            </div>

            {sellerWhatsappUrl && (
              <a
                className="view-details-whatsapp"
                href={sellerWhatsappUrl}
                target="_blank"
                rel="noreferrer"
              >
                <span className="view-details-whatsapp__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" role="img" focusable="false">
                    <path
                      fill="currentColor"
                      d="M12 2a10 10 0 0 0-8.7 14.93L2 22l5.23-1.27A10 10 0 1 0 12 2Zm0 18.18a8.15 8.15 0 0 1-4.16-1.14l-.3-.18-3.1.75.83-3.02-.2-.31A8.18 8.18 0 1 1 12 20.18Zm4.48-6.13c-.24-.12-1.42-.7-1.64-.78-.22-.08-.39-.12-.55.12-.16.24-.63.78-.77.94-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.95-1.22-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.33-.75-1.82-.2-.48-.41-.42-.55-.42h-.47c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 1.99 0 1.17.86 2.31.98 2.47.12.16 1.69 2.58 4.1 3.62.57.24 1.02.39 1.37.5.58.18 1.11.15 1.53.09.47-.07 1.42-.58 1.62-1.13.2-.55.2-1.02.14-1.12-.06-.1-.22-.16-.46-.28Z"
                    />
                  </svg>
                </span>
                <span>WhatsApp seller</span>
              </a>
            )}

            <div className="view-details-actions">
              <button
                type="button"
                className="view-details-button view-details-button--secondary"
                onClick={() => navigate("/")}
              >
                Back to Marketplace
              </button>
              <button
                type="button"
                className="view-details-button view-details-button--cart"
                onClick={handleAddToCart}
              >
                Save to Cart
              </button>
              <button type="button" className="view-details-button" onClick={handleReserveNow}>
                Reserve Now
              </button>
            </div>
          </section>
        </main>

        <section className="view-details-message-card">
          <div className="view-details-message-card__header">
            <div>
              <p className="view-details-header__eyebrow">Buyer to seller chat</p>
              <h2>Send messages to buyer or seller</h2>
              <p>Premium accounts can use encrypted browser-based messaging with sellers.</p>
            </div>
          </div>

          {status && <div className="view-details-message-card__status">{status}</div>}
          {!isPremium && (
            <div className="view-details-message-card__status">
              Premium feature: upgrade your account plan to message sellers directly.
            </div>
          )}

          <div className="view-details-thread">
            {messages.length === 0 ? (
              <div className="view-details-thread__empty">
                Ask about availability, booking windows, amenities, menu items, or payment details.
              </div>
            ) : (
              messages.map((entry) => (
                <article key={entry.id} className="view-details-thread__message">
                  <strong>{entry.senderName}</strong>
                  <p>{entry.text}</p>
                </article>
              ))
            )}
          </div>

          <form className="view-details-message-form" onSubmit={handleSendMessage}>
            <textarea
              rows={4}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={isPremium ? "Write your message to the seller" : "Premium plan required for messaging"}
              disabled={!isPremium}
            />
            <button type="submit" disabled={!isPremium}>Send message</button>
          </form>
        </section>
      </div>
    </div>
  );
}

function buildWhatsAppUrl(phone, text) {
  const normalizedPhone = String(phone || "").replace(/[^\d]/g, "");
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(text)}`;
}

export default ViewDetails;
