import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ChatbotWidget from "../components/ChatbotWidget";
import AdBanner from "../components/AdBanner";
import { syncCatalogToAddProductsApi } from "../utils/api";
import { checkApiStatus, getApiHealthMessage } from "../utils/apiStatus";
import { clearSession, getSession, isPremiumSession } from "../utils/auth";
import { getCartItems } from "../utils/cart";
import { getUserConversations } from "../utils/messages";
import { getMarketplaceListings, seedListings } from "../utils/listings";
import { getBuyerReservations, getSellerReservations } from "../utils/reservations";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const [session, setSession] = useState(() => getSession());
  const [syncStatus, setSyncStatus] = useState("");
  const [syncError, setSyncError] = useState("");
  const [apiStatus, setApiStatus] = useState(null);
  const [showApiStatus, setShowApiStatus] = useState(false);

  useEffect(() => {
    const refresh = () => setSession(getSession());
    window.addEventListener("auth:updated", refresh);
    window.addEventListener("reservations:updated", refresh);
    window.addEventListener("listings:updated", refresh);
    window.addEventListener("messages:updated", refresh);

    // Check API status on mount
    checkApiStatus().then(status => {
      setApiStatus(status);
      if (status.overall !== 'all_working') {
        setShowApiStatus(true);
      }
    });

    return () => {
      window.removeEventListener("auth:updated", refresh);
      window.removeEventListener("reservations:updated", refresh);
      window.removeEventListener("listings:updated", refresh);
      window.removeEventListener("messages:updated", refresh);
    };
  }, []);

  const listings = getMarketplaceListings();
  const buyerReservations = session ? getBuyerReservations(session.email) : [];
  const sellerReservations = session ? getSellerReservations(session.email) : [];
  const cartItems = getCartItems();
  const messages = session ? getUserConversations(session.email) : [];
  const sellerListings = listings.filter((listing) => listing.sellerEmail === session?.email);
  const isPremium = isPremiumSession(session);

  if (!session) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-shell">
          <section className="dashboard-empty">
            <p className="dashboard-header__eyebrow">Sign in required</p>
            <h1>Login to open your dashboard</h1>
            <p>Buyer and seller tools are available after authentication.</p>
            <div className="dashboard-actions">
              <button type="button" onClick={() => navigate("/login", { state: { redirectTo: "/dashboard" } })}>
                Login
              </button>
              <button type="button" onClick={() => navigate("/register")}>
                Sign up
              </button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  const handleSyncCatalog = async () => {
    setSyncStatus("Syncing starter catalog to the addproducts API...");
    setSyncError("");

    const results = await syncCatalogToAddProductsApi(seedListings);
    const failures = results.filter((entry) => !entry.success);

    if (failures.length > 0) {
      setSyncStatus("");
      setSyncError(`Sync completed with ${failures.length} failed item(s).`);
      return;
    }

    setSyncStatus("Starter catalog synced successfully.");
  };

  const stats = session.role === "seller"
    ? [
        { label: "Your listings", value: sellerListings.length },
        { label: "Bookings received", value: sellerReservations.length },
        { label: "Secure message threads", value: messages.length }
      ]
    : [
        { label: "Saved items", value: cartItems.length },
        { label: "Reservations", value: buyerReservations.length },
        { label: "Secure chats", value: messages.length }
      ];

  const sessionPhone = session.phone || "";

  return (
    <div className="dashboard-page">
      <div className="dashboard-shell">
        <AdBanner position="top" />
        <header className="dashboard-header">
          <div>
            <p className="dashboard-header__eyebrow">{session.role} dashboard</p>
            <h1>{session.name || session.email}</h1>
            <p>
              {session.role === "seller"
                ? "Manage listings, see who has booked, review reservation details, and handle buyer conversations."
                : "Track your saved listings, reservations, payment flow, and conversations with sellers."}
            </p>
          </div>

          <div className="dashboard-header__actions">
            <button type="button" onClick={() => navigate("/")}>
              Back to home
            </button>
            {session.role === "seller" && (
              <button type="button" onClick={() => navigate("/add")}>
                Add listing
              </button>
            )}
            <button type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        {syncStatus && <div className="dashboard-status dashboard-status--success">{syncStatus}</div>}
        {syncError && <div className="dashboard-status dashboard-status--error">{syncError}</div>}
        
        {showApiStatus && apiStatus && (
          <div className="dashboard-status dashboard-status--info">
            <div className="api-status-header">
              <span>🔍 API Status</span>
              <button 
                type="button" 
                onClick={() => setShowApiStatus(false)}
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', marginLeft: '10px' }}
              >
                ✕
              </button>
            </div>
            <div className="api-status-message">
              {getApiHealthMessage(apiStatus)}
            </div>
            <div className="api-status-details">
              <small>
                {apiStatus.workingCount}/{apiStatus.totalCount} APIs working
              </small>
            </div>
          </div>
        )}

        <section className="dashboard-grid">
          {stats.map((stat) => (
            <article key={stat.label} className="dashboard-card dashboard-stat">
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </article>
          ))}
        </section>

        {!isPremium && (
          <section className="home-ad-grid">
            <article className="home-ad-card">
              <span>Sponsored</span>
              <strong>Upgrade to Premium</strong>
              <p>Unlock ad-free browsing, dark mode, and exclusive features for just Ksh 100/month.</p>
              <button 
                type="button" 
                onClick={() => navigate('/premium-payment')}
                className="auth-button auth-button--primary"
                style={{ marginTop: '12px' }}
              >
                Upgrade Now for Ksh 100
              </button>
            </article>
            <article className="home-ad-card">
              <span>Promoted</span>
              <strong>List Faster with M-Pesa</strong>
              <p>Sellers can publish new listings with a simple Ksh 30 M-Pesa prompt during submission.</p>
            </article>
          </section>
        )}

        <div className="dashboard-layout">
          <div className="dashboard-column">
            <AdBanner position="side" />
            <section className="dashboard-card dashboard-section">
              <p className="dashboard-section__eyebrow">
                {session.role === "seller" ? "Listings" : "Reservations"}
              </p>
              <h2>
                {session.role === "seller" ? "Your active marketplace listings" : "Your current reservations"}
              </h2>

              <div className="dashboard-section__list">
                {(session.role === "seller" ? sellerListings : buyerReservations).slice(0, 6).map((item) => (
                  <article
                    key={item.id || `${item.listingId}-${item.createdAt}`}
                    className={session.role === "seller" ? "dashboard-listing" : "dashboard-reservation"}
                  >
                    <strong>{item.title || item.listingTitle}</strong>
                    <p>{item.location || item.paymentMethod}</p>
                    <div className={session.role === "seller" ? "dashboard-listing__meta" : "dashboard-reservation__meta"}>
                      <span className="dashboard-pill">{item.category || item.status || "Active"}</span>
                      <span className="dashboard-pill">{item.price || item.paymentMethod || "Reservation"}</span>
                      {session.role === "seller" ? null : <span className="dashboard-pill">{item.sellerName}</span>}
                    </div>
                    {session.role === "seller" ? null : (
                      <small>
                        Reserved by {item.buyerName} | {item.paymentMethod}
                      </small>
                    )}
                  </article>
                ))}

                {(session.role === "seller" ? sellerListings : buyerReservations).length === 0 && (
                  <div className="dashboard-empty">
                    <p>
                      {session.role === "seller"
                        ? "No listings yet. Add your first product, home, hotel, restaurant, or airbnb."
                        : "No reservations yet. Browse the marketplace and reserve something when ready."}
                    </p>
                  </div>
                )}
              </div>

              <div className="dashboard-actions">
                {session.role === "seller" ? (
                  <>
                    <button type="button" onClick={() => navigate("/add")}>
                      Add a listing
                    </button>
                    <button type="button" onClick={handleSyncCatalog}>
                      Sync starter catalog
                    </button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={() => navigate("/cart")}>
                      Open cart
                    </button>
                    <button type="button" onClick={() => navigate("/checkout")}>
                      Checkout
                    </button>
                  </>
                )}
              </div>
            </section>

            {session.role === "seller" && (
              <section className="dashboard-card dashboard-section">
                <p className="dashboard-section__eyebrow">Bookings</p>
                <h2>Who has booked with you</h2>

                <div className="dashboard-section__list">
                  {sellerReservations.slice(0, 6).map((reservation) => (
                    <article key={reservation.id} className="dashboard-reservation">
                      <strong>{reservation.listingTitle}</strong>
                      <p>{reservation.buyerName} | {reservation.buyerEmail}</p>
                      <div className="dashboard-reservation__meta">
                        <span className="dashboard-pill">{reservation.paymentMethod}</span>
                        <span className="dashboard-pill">{reservation.status}</span>
                        <span className="dashboard-pill">{reservation.amount}</span>
                      </div>
                      <small>
                        Reservation date: {reservation.reservationDate || "Flexible"} | Guests: {reservation.guests}
                      </small>
                      <div className="dashboard-contact-row">
                        <span className="dashboard-contact-number">
                          Seller WhatsApp: {sessionPhone || "Add your phone during signup"}
                        </span>
                        {reservation.buyerPhone && (
                          <a
                            className="dashboard-whatsapp"
                            href={buildWhatsAppUrl(
                              reservation.buyerPhone,
                              `Hello ${reservation.buyerName}, this is ${session.name} about your reservation for ${reservation.listingTitle}.`
                            )}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <span className="dashboard-whatsapp__icon" aria-hidden="true">
                              <svg viewBox="0 0 24 24" role="img" focusable="false">
                                <path
                                  fill="currentColor"
                                  d="M12 2a10 10 0 0 0-8.7 14.93L2 22l5.23-1.27A10 10 0 1 0 12 2Zm0 18.18a8.15 8.15 0 0 1-4.16-1.14l-.3-.18-3.1.75.83-3.02-.2-.31A8.18 8.18 0 1 1 12 20.18Zm4.48-6.13c-.24-.12-1.42-.7-1.64-.78-.22-.08-.39-.12-.55.12-.16.24-.63.78-.77.94-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.95-1.22-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.55-1.33-.75-1.82-.2-.48-.41-.42-.55-.42h-.47c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 1.99 0 1.17.86 2.31.98 2.47.12.16 1.69 2.58 4.1 3.62.57.24 1.02.39 1.37.5.58.18 1.11.15 1.53.09.47-.07 1.42-.58 1.62-1.13.2-.55.2-1.02.14-1.12-.06-.1-.22-.16-.46-.28Z"
                                />
                              </svg>
                            </span>
                            <span>WhatsApp buyer</span>
                          </a>
                        )}
                      </div>
                    </article>
                  ))}

                  {sellerReservations.length === 0 && (
                    <div className="dashboard-empty">
                      <p>Your booking list will appear here after buyers reserve your listings.</p>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>

          <div className="dashboard-column">
            <section className="dashboard-card dashboard-section">
              <p className="dashboard-section__eyebrow">Secure messages</p>
              <h2>Encrypted buyer and seller inbox</h2>

              <div className="dashboard-section__list">
                {messages.slice(0, 6).map((message) => (
                  <article key={message.id} className="dashboard-message">
                    <strong>
                      {message.senderEmail === session.email ? message.recipientName : message.senderName}
                    </strong>
                    <p>{message.senderEmail === session.email ? "You started this conversation." : "New buyer or seller conversation."}</p>
                    <small>{new Date(message.createdAt).toLocaleString()}</small>
                  </article>
                ))}
 
                {messages.length === 0 && (
                  <div className="dashboard-empty">
                    <p>Messages from the property details page will appear here after buyers contact sellers.</p>
                  </div>
                )}
              </div>
            </section>

            <section className="dashboard-card dashboard-section">
              <p className="dashboard-section__eyebrow">Marketplace workflow</p>
              <h2>What this app now supports</h2>
              <div className="dashboard-section__list">
                <article className="dashboard-message">
                  <strong>Role-aware onboarding</strong>
                  <p>Sellers receive an admin password during signup and must use it when adding a listing.</p>
                </article>
                <article className="dashboard-message">
                  <strong>Subscriptions</strong>
                  <p>Free accounts handle core browsing and reservations. Premium accounts unlock secure seller messaging and reduced ads.</p>
                </article>
                <article className="dashboard-message">
                  <strong>Reservations and cart API</strong>
                  <p>Buyer checkout sends cart and reservation payloads to the configured backend endpoints.</p>
                </article>
                <article className="dashboard-message">
                  <strong>Payment-aware forms</strong>
                  <p>M-Pesa, bank transfer, and card flows each collect their required details before reservation submission.</p>
                </article>
              </div>
            </section>
          </div>
        </div>
        <AdBanner position="bottom" />
      </div>
      <ChatbotWidget listings={listings} />
    </div>
  );
}

function buildWhatsAppUrl(phone, text) {
  const normalizedPhone = String(phone || "").replace(/[^\d]/g, "");
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(text)}`;
}

export default Dashboard;
