import axios from "axios";

const API_ORIGIN = process.env.REACT_APP_API_ORIGIN || "http://127.0.0.1:5000";

export const API_ENDPOINTS = {
  signin: `${API_ORIGIN}/api/signin`,
  signup: `${API_ORIGIN}/api/signup`,
  addproducts: `${API_ORIGIN}/api/addproducts`,
  verifyListingPayment: `${API_ORIGIN}/api/verify_listing_payment`,
  mpesaPayment: `${API_ORIGIN}/api/mpesa_payment`,
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
  return error?.isNetworkError || error?.status === 404 || error?.status === 405;
}

export function getFriendlyApiErrorMessage(error, fallback = "That service is unavailable right now.") {
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
  );
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
  );
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
  );
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
