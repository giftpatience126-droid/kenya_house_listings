import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdBanner from "../components/AdBanner";
import { saveCartApi } from "../utils/api";
import { getSession } from "../utils/auth";
import { clearCart, getCartItems, removeFromCart } from "../utils/cart";
import "./Cart.css";

function Cart() {
  const navigate = useNavigate();
  const session = getSession();
  const [items, setItems] = useState(() => getCartItems());

  useEffect(() => {
    const syncCart = async () => {
      if (!session || items.length === 0) {
        return;
      }

      try {
        await saveCartApi({
          buyerEmail: session.email,
          buyerName: session.name,
          items
        });
      } catch (error) {
        // Cart remains available even if backend sync is unavailable.
      }
    };

    syncCart();
  }, [items, session]);

  const totalLabel = useMemo(() => {
    const total = items.reduce((sum, item) => {
      const value = Number(String(item.price).replace(/[^\d.]/g, ""));
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);
    return `Ksh ${total.toLocaleString()}`;
  }, [items]);

  const handleRemove = (id) => {
    const next = removeFromCart(id);
    setItems(next);
  };

  const handleClear = () => {
    const next = clearCart();
    setItems(next);
  };

  if (!session) {
    return (
      <div className="cart-main">
        <AdBanner position="side" />
        <div className="cart-section">
          <section className="cart-empty">
            <h2>Login required</h2>
            <p>Sign in before saving listings to cart or moving to reservation checkout.</p>
            <div className="cart-footer-actions">
              <button type="button" onClick={() => navigate("/login", { state: { redirectTo: "/cart" } })}>
                Login
              </button>
              <button type="button" onClick={() => navigate("/")}>
                Back to marketplace
              </button>
            </div>
          </section>
        </div>
        <AdBanner position="bottom" />
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-shell">
        <AdBanner position="top" />
        <header className="cart-header">
          <div>
            <p className="cart-header__eyebrow">Saved listings</p>
            <h1>Your Cart</h1>
            <p>
              Keep homes, airbnbs, hotels, and restaurants here before sending your
              reservation request.
            </p>
          </div>
          <button type="button" className="cart-header__back" onClick={() => navigate("/")}>
            Back to Marketplace
          </button>
        </header>

        <section className="cart-summary">
          <span>{items.length} item{items.length === 1 ? "" : "s"} saved</span>
          <strong>Estimated total: {totalLabel}</strong>
        </section>

        {items.length === 0 ? (
          <section className="cart-empty">
            <h2>Your cart is empty</h2>
            <p>Add listings from the marketplace or listing details page to see them here.</p>
          </section>
        ) : (
          <section className="cart-grid">
            {items.map((item) => (
              <article key={item.id} className="cart-card">
                <img src={item.imageUrl} alt={item.title} />
                <div className="cart-card__body">
                  <span className="cart-card__tag">{item.category}</span>
                  <h3>{item.title}</h3>
                  <p>{item.location}</p>
                  <p>Seller: {item.sellerName}</p>
                  <strong>{item.price}</strong>
                  <div className="cart-card__actions">
                    <button type="button" onClick={() => navigate("/ViewDetails", { state: { property: item } })}>
                      View Details
                    </button>
                    <button type="button" className="danger" onClick={() => handleRemove(item.id)}>
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}

        {items.length > 0 && (
          <div className="cart-footer-actions">
            <button type="button" onClick={handleClear}>
              Clear Cart
            </button>
            <button type="button" onClick={() => navigate("/checkout")}>
              Continue to Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Cart;
