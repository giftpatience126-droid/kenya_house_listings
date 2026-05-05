const RESERVATIONS_KEY = "khl_reservations";

export function getReservations() {
  try {
    const raw = window.localStorage.getItem(RESERVATIONS_KEY);
    const reservations = raw ? JSON.parse(raw) : [];
    return Array.isArray(reservations) ? reservations : [];
  } catch (error) {
    return [];
  }
}

export function saveReservation(reservation) {
  const next = [reservation, ...getReservations()];
  window.localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("reservations:updated"));
  return next;
}

export function getBuyerReservations(email) {
  return getReservations().filter((reservation) => reservation.buyerEmail === email);
}

export function getSellerReservations(email) {
  return getReservations().filter((reservation) => reservation.sellerEmail === email);
}
