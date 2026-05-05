import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { premiumPaymentApi, verifyPremiumPaymentApi } from '../utils/api';
import { getSession, hasPaidPremiumFee, setPremiumFeePaid } from '../utils/auth';
import './PremiumPayment.css';

const PREMIUM_FEE = 100;

function PremiumPayment() {
  const navigate = useNavigate();
  const session = getSession();
  const [paymentStatus, setPaymentStatus] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [sendingPayment, setSendingPayment] = useState(false);
  const [error, setError] = useState('');

  const hasPaidPremium = hasPaidPremiumFee(session);

  // Redirect if already premium
  if (hasPaidPremium) {
    navigate('/dashboard');
    return null;
  }

  const handleSendPayment = async () => {
    if (!session) {
      setError('Please login first');
      return;
    }

    setSendingPayment(true);
    setError('');
    setPaymentStatus('Sending Ksh 100 M-Pesa prompt for premium upgrade...');

    try {
      await premiumPaymentApi({
        email: session.email,
        phone: session.phone,
        amount: PREMIUM_FEE
      });
      setPaymentStatus('Ksh 100 M-Pesa prompt sent. Complete it on your phone.');
    } catch (apiError) {
      setError(apiError.message || 'Failed to send payment prompt');
      setPaymentStatus('');
    } finally {
      setSendingPayment(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!transactionId.trim()) {
      setError('Please enter a valid transaction ID');
      return;
    }

    setVerifyingPayment(true);
    setError('');
    setPaymentStatus('Verifying premium payment...');

    try {
      await verifyPremiumPaymentApi({
        email: session.email,
        transactionId: transactionId,
        phone: session.phone,
        amount: PREMIUM_FEE
      });
      
      setPremiumFeePaid();
      setPaymentStatus('Premium payment verified! Redirecting to dashboard...');
      
      // Redirect to dashboard after successful verification
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (apiError) {
      setError(apiError.message || 'Payment verification failed');
      setPaymentStatus('');
    } finally {
      setVerifyingPayment(false);
    }
  };

  return (
    <div className="premium-payment-page">
      <div className="premium-payment-shell">
        <div className="premium-payment-container">
          <div className="premium-payment-header">
            <h1>🌟 Upgrade to Premium</h1>
            <p>Get ad-free browsing, dark mode, and exclusive features for just Ksh 100/month</p>
          </div>

          <div className="premium-payment-benefits">
            <div className="benefit-item">
              <span className="benefit-icon">🚫</span>
              <div>
                <h3>Ad-Free Experience</h3>
                <p>Browse without any advertisements</p>
              </div>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">🌙</span>
              <div>
                <h3>Dark Mode</h3>
                <p>Toggle between light and dark themes</p>
              </div>
            </div>
            <div className="benefit-item">
              <span className="benefit-icon">⭐</span>
              <div>
                <h3>Premium Badge</h3>
                <p>Show your premium status on listings</p>
              </div>
            </div>
          </div>

          <div className="premium-payment-section">
            <div className="payment-info">
              <h2>Payment Required</h2>
              <p className="price">Ksh {PREMIUM_FEE} <span>/month</span></p>
              <p>Pay with M-Pesa to activate premium features</p>
            </div>

            {error && <div className="error-message">{error}</div>}
            {paymentStatus && <div className="payment-status">{paymentStatus}</div>}

            <div className="payment-actions">
              <div className="payment-option">
                <h3>Step 1: Send Payment</h3>
                <button
                  type="button"
                  onClick={handleSendPayment}
                  disabled={sendingPayment || paymentStatus.includes('sent')}
                  className="payment-button"
                >
                  {sendingPayment ? 'Sending Prompt...' : 'Pay Ksh 100 with M-Pesa'}
                </button>
              </div>

              <div className="payment-option">
                <h3>Step 2: Verify Payment</h3>
                <div className="verification-input">
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="Enter M-Pesa transaction ID"
                    className="transaction-input"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyPayment}
                    disabled={verifyingPayment || !transactionId.trim()}
                    className="verify-button"
                  >
                    {verifyingPayment ? 'Verifying...' : 'Verify Payment'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="premium-payment-footer">
            <button 
              type="button" 
              onClick={() => navigate('/dashboard')}
              className="back-button"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PremiumPayment;
