import axios from "axios";
import { buildSessionFromUser, findUserByEmail, saveUser } from "./auth";

const DEFAULT_PRODUCTION_API_ORIGIN = "https://kenya-house-listings-api.vercel.app";
const configuredApiOrigin = process.env.REACT_APP_API_ORIGIN || "";
const API_ORIGIN = (configuredApiOrigin || DEFAULT_PRODUCTION_API_ORIGIN).replace(/\/$/, "");
const apiUrl = (path) => `${API_ORIGIN}${path}`;

// Configure axios defaults for better CORS handling
axios.defaults.withCredentials = false;
axios.defaults.headers.common['Content-Type'] = 'application/json';

export const API_ENDPOINTS = {
  health: apiUrl("/api/health"),
  signin: apiUrl("/api/signin"),
  signup: apiUrl("/api/signup"),
  addproducts: apiUrl("/api/addproducts"),
  verifyListingPayment: apiUrl("/api/verify_listing_payment"),
  mpesaPayment: apiUrl("/api/mpesa_payment"),
  premiumPayment: apiUrl("/api/premium_payment"),
  verifyPremiumPayment: apiUrl("/api/verify_premium_payment"),
  cart: apiUrl("/api/cart"),
  reservations: apiUrl("/api/reservations")
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
    return "The request reached the wrong app or route. Check that the frontend API URL points to the backend Vercel project.";
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
  ).catch((error) => {
    if (!isRecoverableApiError(error)) {
      throw error;
    }

    const user = findUserByEmail(payload.email);
    if (!user) {
      throw error;
    }

    if (user.password !== payload.password) {
      const passwordError = new Error("Incorrect password.");
      passwordError.status = 401;
      throw passwordError;
    }

    return {
      message: "Login successful from local device data",
      user: buildSessionFromUser(user),
      offline: true
    };
  });
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
  ).catch((error) => {
    if (!isRecoverableApiError(error)) {
      throw error;
    }

    if (findUserByEmail(payload.email)) {
      const duplicateError = new Error("User with this email already exists on this device.");
      duplicateError.status = 400;
      throw duplicateError;
    }

    saveUser({
      ...payload,
      createdAt: new Date().toISOString(),
      savedLocally: true
    });

    return {
      message: "Account saved locally while the backend is unavailable",
      user: payload,
      offline: true
    };
  });
}

export function addProductApi(formData) {
  return post(API_ENDPOINTS.addproducts, formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  }).catch((error) => {
    if (!isRecoverableApiError(error)) {
      throw error;
    }

    const localListing = listingFromFormData(formData);
    return {
      message: "Listing saved locally while the backend is unavailable",
      product: localListing,
      offline: true
    };
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
  ).catch((error) => {
    if (!isRecoverableApiError(error)) {
      throw error;
    }

    return mockPaymentVerification(payload, "Listing payment verified locally");
  });
}

export function premiumPaymentApi(payload) {
  return mpesaPaymentApi({
    ...payload,
    amount: payload.amount || "100",
    account_reference: payload.account_reference || "Premium Upgrade",
    transaction_desc: payload.transaction_desc || "Kenya House Listings Premium upgrade"
  });
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
  ).catch((error) => {
    if (!isRecoverableApiError(error)) {
      throw error;
    }

    return mockPaymentVerification(payload, "Premium payment verified locally");
  });
}

export function mpesaPaymentApi(payload) {
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
  ).then((data) => {
    if (data?.prompt_sent === false) {
      const promptError = new Error(data.error || "M-Pesa prompt was not sent.");
      promptError.status = 503;
      promptError.data = data;
      throw promptError;
    }

    return data;
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

function mockPaymentVerification(payload, message) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message,
        transactionId: payload.transactionId || `LOCAL-${Date.now()}`,
        phone: payload.phone,
        amount: payload.amount,
        offline: true
      });
    }, 400);
  });
}

function listingFromFormData(formData) {
  const getValue = (key) => {
    if (typeof formData?.get === "function") {
      return formData.get(key) || "";
    }

    return "";
  };
  const category = String(getValue("category") || "home").trim();
  const sellerEmail = String(getValue("seller_email")).trim();

  return {
    id: `${category || "home"}-${Date.now()}`,
    title: String(getValue("product_name")).trim(),
    description: String(getValue("product_description")).trim(),
    price: String(getValue("product_cost") || getValue("price")).trim(),
    location: String(getValue("location")).trim(),
    category,
    tag: "Offline",
    sellerEmail,
    sellerName: String(getValue("seller_name")).trim(),
    sellerPhone: "",
    imageUrl: String(getValue("product_photo_url") || getValue("imageUrl")).trim() || "https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?auto=format&fit=crop&w=900&q=80"
  };
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
