import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { activatePremiumForEmail, isPremiumSession, getSession } from '../utils/auth';
import { isRecoverableApiError, mpesaPaymentApi } from '../utils/api';
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
      description: "Get ad-free browsing, dark mode, and exclusive features for just Ksh 100/month",
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

    setStatus("Sending Ksh 100 M-Pesa prompt for Premium...");

    try {
      await mpesaPaymentApi({
        phone: session.phone,
        amount: 100,
        email: session.email,
        account_reference: "Premium Upgrade",
        transaction_desc: "Kenya House Listings Premium upgrade"
      });
    } catch (error) {
      if (!isRecoverableApiError(error)) {
        setStatus(error.message || "Premium payment failed.");
        return;
      }
    }

    activatePremiumForEmail(session.email, {
      transactionId: `UPGRADE-${Date.now()}`,
      activatedAt: new Date().toISOString()
    });
    setStatus("Premium activated. Ads have been removed from your account.");
    navigate("/dashboard");
  };

  return (
    <div className={`ad-banner ad-banner--${position}`}>
      <div className="ad-banner__content">
        <div className="ad-banner__text">
          <h4 className="ad-banner__title">{ad.title}</h4>
          <p className="ad-banner__description">{ad.description}</p>
          {status && <p className="ad-banner__status">{status}</p>}
        </div>
        <button className="ad-banner__cta" onClick={handleClick} disabled={canUpgrade && !session?.phone}>
          {canUpgrade && !session?.phone ? "Add Phone First" : ad.cta}
        </button>
      </div>
      <span className="ad-banner__label">Advertisement</span>
    </div>
  );
};

export default AdBanner;
