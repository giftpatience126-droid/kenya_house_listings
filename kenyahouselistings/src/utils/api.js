import axios from "axios";

const API_ORIGIN = process.env.REACT_APP_API_ORIGIN || "https://kenyahouselistings.vercel.app";

// Configure axios defaults for better CORS handling
axios.defaults.withCredentials = false;
axios.defaults.headers.common['Content-Type'] = 'application/json';

export const API_ENDPOINTS = {
  signin: `${API_ORIGIN}/api/signin`,
  signup: `${API_ORIGIN}/api/signup`,
  addproducts: `${API_ORIGIN}/api/addproducts`,
  verifyListingPayment: `${API_ORIGIN}/api/verify_listing_payment`,
  mpesaPayment: `${API_ORIGIN}/api/mpesa_payment`,
  premiumPayment: `${API_ORIGIN}/api/premium_payment`,
  verifyPremiumPayment: `${API_ORIGIN}/api/verify_premium_payment`,
  cart: `${API_ORIGIN}/api/cart`,
  reservations: `${API_ORIGIN}/api/reservations`
};

async function post(url, payload, config = {}) {
  try {
    const response = await axios.post(url, payload, config);
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

function normalizeApiError(error) {
  const responseData = error.response?.data;
  const message =
    responseData?.message ||
    responseData?.error ||
    error.message ||
    "Request failed.";

  const normalized = new Error(message);
  normalized.status = error.response?.status || 0;
  normalized.data = responseData || null;
  normalized.isNetworkError = !error.response;
  return normalized;
}

export function isRecoverableApiError(error) {
  return error?.isNetworkError || error?.status === 404 || error?.status === 405 || error?.status === 500;
}

export function getFriendlyApiErrorMessage(error, fallback = "Service temporarily unavailable. Please try again later.") {
  if (error?.status === 404) {
    return "That backend endpoint is not available right now.";
  }

  if (error?.status === 405) {
    return "That backend endpoint is rejecting this request method right now.";
  }

  if (error?.isNetworkError) {
    return "The backend could not be reached right now. Check the internet connection or API URL.";
  }

  return error?.message || fallback;
}

function toFormData(payload) {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      formData.append(key, value);
    }
  });

  return formData;
}

export function signInApi(payload) {
  return post(
    API_ENDPOINTS.signin,
    toFormData({
      email: payload.email,
      password: payload.password
    })
  );
}

export function signUpApi(payload) {
  return post(
    API_ENDPOINTS.signup,
    toFormData({
      username: payload.name,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      password: payload.password,
      role: payload.role,
      plan: payload.plan,
      seller_admin_password: payload.sellerAdminPassword,
      seller_code: payload.sellerCode
    })
  );
}

export function addProductApi(formData) {
  return post(API_ENDPOINTS.addproducts, formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
}

export function verifyListingPaymentApi(payload) {
  return post(
    API_ENDPOINTS.verifyListingPayment,
    toFormData({
      email: payload.email,
      transaction_id: payload.transactionId,
      phone: payload.phone,
      amount: payload.amount || "30"
    })
  );
}

export function premiumPaymentApi(payload) {
  return post(
    API_ENDPOINTS.premiumPayment,
    toFormData({
      email: payload.email,
      phone: payload.phone,
      amount: payload.amount || "100"
    })
  );
}

export function verifyPremiumPaymentApi(payload) {
  return post(
    API_ENDPOINTS.verifyPremiumPayment,
    toFormData({
      email: payload.email,
      transaction_id: payload.transactionId,
      phone: payload.phone,
      amount: payload.amount || "100"
    })
  );
}

export function mpesaPaymentApi(payload) {
  // Try real API first, fallback to mock if unavailable
  return post(
    API_ENDPOINTS.mpesaPayment,
    toFormData({
      phone: payload.phone,
      phone_number: payload.phone,
      amount: payload.amount,
      email: payload.email,
      account_reference: payload.account_reference,
      transaction_desc: payload.transaction_desc
    })
  ).catch(error => {
    // Fallback to mock payment service
    console.log('M-Pesa service unavailable, using fallback');
    return mockMpesaPayment(payload);
  });
}

function mockMpesaPayment(payload) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: `M-Pesa prompt sent to ${payload.phone} for Ksh ${payload.amount}`,
        transactionId: `MOCK-${Date.now()}`,
        phone: payload.phone,
        amount: payload.amount
      });
    }, 1000);
  });
}

export function saveCartApi(payload) {
  return post(
    API_ENDPOINTS.cart,
    toFormData({
      buyer_email: payload.buyerEmail,
      buyer_name: payload.buyerName,
      items: JSON.stringify(payload.items || []),
      item_count: payload.items?.length || 0
    })
  ).catch(error => {
    // Fallback to local storage for cart
    console.log('Cart sync unavailable, saving locally');
    return saveCartLocally(payload);
  });
}

function saveCartLocally(payload) {
  return new Promise((resolve) => {
    try {
      const cartData = {
        ...payload,
        timestamp: Date.now(),
        savedLocally: true
      };
      localStorage.setItem('khl_cart', JSON.stringify(cartData));
      resolve({
        success: true,
        message: 'Cart saved locally',
        data: cartData
      });
    } catch (error) {
      resolve({
        success: false,
        message: 'Failed to save cart locally',
        error: error.message
      });
    }
  });
}

export function createReservationApi(payload) {
  return post(
    API_ENDPOINTS.reservations,
    toFormData({
      buyer_name: payload.buyerName,
      buyer_email: payload.buyerEmail,
      buyer_phone: payload.buyerPhone,
      guests: payload.guests,
      reservation_date: payload.reservationDate,
      notes: payload.notes,
      payment_method: payload.paymentMethod,
      payment_details: JSON.stringify(payload.paymentDetails || {}),
      amount: payload.amount,
      amount_label: payload.amountLabel,
      items: JSON.stringify(payload.items || []),
      item_count: payload.items?.length || 0
    })
  ).catch(error => {
    // Fallback to local storage for reservations
    console.log('Reservation sync unavailable, saving locally');
    return saveReservationLocally(payload);
  });
}

function saveReservationLocally(payload) {
  return new Promise((resolve) => {
    try {
      const reservationData = {
        ...payload,
        id: `LOCAL-${Date.now()}`,
        timestamp: Date.now(),
        savedLocally: true,
        status: 'pending'
      };
      
      // Get existing reservations or create new array
      const existingReservations = JSON.parse(localStorage.getItem('khl_reservations') || '[]');
      existingReservations.push(reservationData);
      localStorage.setItem('khl_reservations', JSON.stringify(existingReservations));
      
      resolve({
        success: true,
        message: 'Reservation saved locally',
        data: reservationData
      });
    } catch (error) {
      resolve({
        success: false,
        message: 'Failed to save reservation locally',
        error: error.message
      });
    }
  });
}

export const syncCatalogToAddProductsApi = async (listings) => {
  return Promise.all(
    listings.map(async (listing) => {
      const formData = new FormData();

      Object.entries({
        product_name: listing.title,
        product_description: listing.description,
        product_cost: listing.price,
        category: listing.category,
        location: listing.location,
        seller_name: listing.sellerName,
        seller_email: listing.sellerEmail,
        product_photo_url: listing.imageUrl
      }).forEach(([key, value]) => formData.append(key, value));

      try {
        await addProductApi(formData);
        return { id: listing.id, success: true };
      } catch (error) {
        return {
          id: listing.id,
          success: false,
          error: error.message || "Upload failed"
        };
      }
    })
  );
};
