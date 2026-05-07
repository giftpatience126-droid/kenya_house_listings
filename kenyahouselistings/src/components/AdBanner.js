import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isPremiumSession, getSession } from '../utils/auth';
import { mpesaPaymentApi } from '../utils/api';
import './AdBanner.css';

const AdBanner = ({ position = 'top' }) => {
  const navigate = useNavigate();
  const session = getSession();
  const isPremium = isPremiumSession(session);
  const [status, setStatus] = useState("");

  // Don't show ads for premium users
  if (isPremium) {
    return null;
  }

  const adContent = {
    top: {
      title: "🎯 Upgrade to Premium",
      description: "Pay Ksh 100 and an M-Pesa prompt will be sent to the phone number you signed up with.",
      cta: "Upgrade Now"
    },
    side: {
      title: "📱 M-Pesa Integration",
      description: "Pay for listings and reservations instantly with M-Pesa",
      cta: "Learn More"
    },
    bottom: {
      title: "🏠 List Your Property",
      description: "Reach thousands of buyers by listing your property on our platform",
      cta: "Add Listing"
    }
  };

  const ad = adContent[position] || adContent.top;
  const canUpgrade = Boolean(session && !isPremium && ad.cta === "Upgrade Now");

  const handleClick = async () => {
    if (ad.cta === "Add Listing") {
      navigate("/add");
      return;
    }

    if (ad.cta !== "Upgrade Now") {
      navigate(session ? "/dashboard" : "/register");
      return;
    }

    if (!session) {
      navigate("/register", { state: { redirectTo: "/dashboard" } });
      return;
    }

    setStatus(`Sending Ksh 100 M-Pesa prompt to ${session.phone}...`);

    try {
      await mpesaPaymentApi({
        phone: session.phone,
        amount: 100,
        email: session.email,
        account_reference: "Premium Upgrade",
        transaction_desc: "Kenya House Listings Premium upgrade"
      });
    } catch (error) {
      setStatus(error.message || "Premium payment prompt could not be sent.");
      return;
    }

    setStatus("Prompt sent. Complete payment on your phone, then verify it from the Premium page.");
    navigate("/premium-payment");
  };

  return (
    <div className={`ad-banner ad-banner--${position}`}>
      <div className="ad-banner__content">
        <div className="ad-banner__text">
          <h4 className="ad-banner__title">{ad.title}</h4>
          <p className="ad-banner__description">{ad.description}</p>
          {status && <p className="ad-banner__status">{status}</p>}
        </div>
        <button className="ad-banner__cta" onClick={handleClick}>
          {canUpgrade && !session?.phone ? "Use Signup Phone" : ad.cta}
        </button>
      </div>
      <span className="ad-banner__label">Advertisement</span>
    </div>
  );
};

export default AdBanner;
