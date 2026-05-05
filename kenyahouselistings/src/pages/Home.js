import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ChatbotWidget from "../components/ChatbotWidget";
import PropertyCard from "../components/PropertyCard";
import AdBanner from "../components/AdBanner";
import { clearSession, getSession, isPremiumSession } from "../utils/auth";
import { getCartItems } from "../utils/cart";
import { getMarketplaceListings, MARKETPLACE_CATEGORIES } from "../utils/listings";
import { useTheme } from "../contexts/ThemeContext";
import "./Home.css";

const INITIAL_VISIBLE = 10;
const LOAD_STEP = 10;
const LOAD_DELAY_MS = 1200;

function Home() {
  const navigate = useNavigate();
  const { toggleTheme, isLight } = useTheme();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const [loadingMore, setLoadingMore] = useState(false);
  const [session, setSession] = useState(() => getSession());
  const [cartCount, setCartCount] = useState(() => getCartItems().length);
  const [, setListingsVersion] = useState(0);

  useEffect(() => {
    const handleAuthChange = () => setSession(getSession());
    const handleCartChange = () => setCartCount(getCartItems().length);
    const handleListingsChange = () => setListingsVersion((current) => current + 1);

    window.addEventListener("auth:updated", handleAuthChange);
    window.addEventListener("cart:updated", handleCartChange);
    window.addEventListener("listings:updated", handleListingsChange);

    return () => {
      window.removeEventListener("auth:updated", handleAuthChange);
      window.removeEventListener("cart:updated", handleCartChange);
      window.removeEventListener("listings:updated", handleListingsChange);
    };
  }, []);

  const listings = getMarketplaceListings();

  const filteredListings = useMemo(
    () =>
      listings.filter((listing) => {
        const matchesCategory = category === "all" || listing.category === category;
        const haystack = `${listing.title} ${listing.location} ${listing.category} ${listing.description}`.toLowerCase();
        const matchesQuery = haystack.includes(query.toLowerCase());
        return matchesCategory && matchesQuery;
      }),
    [category, listings, query]
  );

  const visibleListings = useMemo(
    () => filteredListings.slice(0, visibleCount),
    [filteredListings, visibleCount]
  );

  const hasMore = visibleCount < filteredListings.length;
  const progress = filteredListings.length === 0
    ? 0
    : Math.min((visibleListings.length / filteredListings.length) * 100, 100);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE);
  }, [query, category]);

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) {
      return;
    }

    setLoadingMore(true);

    window.setTimeout(() => {
      setVisibleCount((current) => Math.min(current + LOAD_STEP, filteredListings.length));
      setLoadingMore(false);
    }, LOAD_DELAY_MS);
  };

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };
  const isPremium = isPremiumSession(session);

  return (
    <div className="home-page">
      <div className="home-page__glow home-page__glow--one" />
      <div className="home-page__glow home-page__glow--two" />

      <div className="home-shell">
        <AdBanner position="top" />
        <div className="home-topbar">
          <div className="home-topbar__brand">
            <span>Kenya House Listings</span>
            <small>
              Buyer and seller tools in one place
              {session ? ` | ${session.plan || "free"} plan` : ""}
            </small>
            {isPremium && (
              <button
                type="button"
                onClick={toggleTheme}
                className="home-topbar__theme-toggle"
                title={`Switch to ${isLight ? 'dark' : 'light'} mode`}
              >
                {isLight ? '🌙' : '☀️'}
              </button>
            )}
          </div>

          <div className="home-topbar__actions">
            <button type="button" onClick={() => navigate("/cart")}>
              Cart ({cartCount})
            </button>

            {session ? (
              <>
                <button type="button" onClick={() => navigate("/dashboard")}>
                  Dashboard
                </button>
                {session.role === "seller" && (
                  <button type="button" onClick={() => navigate("/add")}>
                    Add Listing
                  </button>
                )}
                <button type="button" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => navigate("/login")}>
                  Login
                </button>
                <button type="button" onClick={() => navigate("/register")}>
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>

        <header className="home-hero">
          <div className="home-hero__copy">
            <p className="home-hero__eyebrow">Marketplace</p>
            <h1>Homes, airbnbs, hotels, and restaurants in one clean flow.</h1>
            <p className="home-hero__text">
              Browse publicly, then sign in only when you want to reserve, pay,
              message a seller, or manage listings from your dashboard.
            </p>

            <div className="home-hero__search">
              <label htmlFor="home-search">Search by title, location, or category</label>
              <input
                id="home-search"
                type="text"
                placeholder="Try Nyali, hotel, Kisumu, home, or restaurant"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>

            <div className="home-hero__categories">
              {MARKETPLACE_CATEGORIES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={category === item.id ? "is-active" : ""}
                  onClick={() => setCategory(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

            <div className="home-hero__panel">
              <div className="home-hero__panel-top">
              {session ? (
                <>
                  <div>
                    <p className="home-hero__panel-label">{session.role} access</p>
                    <strong>{session.name}</strong>
                  </div>
                  <span className="home-hero__cart">Cart {cartCount}</span>
                </>
              ) : (
                <>
                  <div>
                    <p className="home-hero__panel-label">Guest access</p>
                    <strong>Browse without logging in</strong>
                  </div>
                  <span className="home-hero__cart">Cart {cartCount}</span>
                </>
              )}
            </div>

            <div className="home-hero__stats">
              <article>
                <strong>{listings.length}</strong>
                <span>Total listings</span>
              </article>
              <article>
                <strong>{filteredListings.length}</strong>
                <span>Current results</span>
              </article>
              <article>
                <strong>{MARKETPLACE_CATEGORIES.length - 1}</strong>
                <span>Buyer categories</span>
              </article>
              <article>
                <strong>{session ? (isPremium ? "Premium" : "Free") : "Guest"}</strong>
                <span>Current plan</span>
              </article>
            </div>

            <div className="home-hero__actions">
              {session ? (
                <>
                  {session.role === "seller" && (
                    <button type="button" onClick={() => navigate("/add")}>
                      Manage Seller Listings
                    </button>
                  )}
                  {/* <button type="button" onClick={() => navigate("/dashboard")}>
                    Open Dashboard
                  </button> */}
                </>
              ) : (
                <>
                  <button type="button" onClick={() => navigate("/login", { state: { redirectTo: "/dashboard" } })}>
                    Login to interact
                  </button>
                  <button type="button" onClick={() => navigate("/register")}>
                    Create account
                  </button>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="home-content">
          <AdBanner position="side" />

          <section className="home-section">
            <div className="home-section__heading">
              <div>
                <p className="home-section__eyebrow">Curated listings</p>
                <h2>Pick a category and explore available options</h2>
              </div>
              <span className="home-section__count">
                Showing {visibleListings.length} of {filteredListings.length}
              </span>
            </div>

            {filteredListings.length > 0 && (
              <div className="home-progress">
                <div className="home-progress__row">
                  <span>Browse progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="home-progress__track">
                  <div
                    className={`home-progress__fill${loadingMore ? " is-loading" : ""}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="home-progress__copy">
                  {loadingMore
                    ? "Loading the next 10 listings..."
                    : hasMore
                      ? "Load more to reveal the next batch."
                      : "You have reached the end of the filtered results."}
                </p>
              </div>
            )}

            <div className="home-grid">
              {visibleListings.map((listing) => (
                <PropertyCard key={listing.id} property={listing} />
              ))}
            </div>

            {filteredListings.length === 0 && (
              <div className="home-empty">
                <h3>No listings matched your search.</h3>
                <p>Try another location or switch to a different category.</p>
              </div>
            )}

            {hasMore && (
              <div className="home-load-more">
                <button type="button" onClick={handleLoadMore} disabled={loadingMore}>
                  {loadingMore ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </section>
        </main>
        <AdBanner position="bottom" />
      </div>

      <ChatbotWidget listings={filteredListings.length > 0 ? filteredListings : listings} />
    </div>
  );
}

export default Home;
