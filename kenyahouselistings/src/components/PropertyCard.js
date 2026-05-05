import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addToCart } from "../utils/cart";
import { getSession } from "../utils/auth";

function PropertyCard({ property }) {
  const navigate = useNavigate();
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!notice) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => setNotice(""), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  const handleAddToCart = () => {
    const session = getSession();
    if (!session) {
      navigate("/login", {
        state: {
          redirectTo: "/cart",
          reason: "Login is required before you can save or reserve a listing."
        }
      });
      return;
    }

    addToCart(property);
    setNotice("Listing added to cart.");
  };

  return (
    <article className="property-card">
      <div className="property-card__media">
        <img src={property.imageUrl} alt={property.title} />
        <span className="property-card__tag">{property.tag}</span>
      </div>

      <div className="property-card__body">
        <div className="property-card__price-row">
          <h3>{property.price}</h3>
          <span className="property-card__status">Available</span>
        </div>

        <p className="property-card__title">{property.title}</p>
        <p className="property-card__location">Location: {property.location}</p>
        <p className="property-card__location">Category: {property.category}</p>
        <p className="property-card__meta">{property.description}</p>

        {notice && (
          <div className="property-card__notice">
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice("")} aria-label="Close cart notice">
              x
            </button>
          </div>
        )}

        <div className="property-card__actions">
          <button
            type="button"
            className="property-card__button"
            onClick={() => navigate("/ViewDetails", { state: { property } })}
          >
            View Details
          </button>
          <button
            type="button"
            className="property-card__button property-card__button--secondary"
            onClick={handleAddToCart}
          >
            Add to cart
          </button>
        </div>
      </div>
    </article>
  );
}

export default PropertyCard;
