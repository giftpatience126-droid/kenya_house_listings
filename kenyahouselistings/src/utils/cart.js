const CART_KEY = "khl_cart_items";

const storage = {
  get: (key) => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  set: (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("cart:updated"));
  }
};

export const getCartItems = () => storage.get(CART_KEY);

const saveCartItems = (items) => storage.set(CART_KEY, items);

const buildListingId = (listing) => 
  `${listing.title}-${listing.location}`.toLowerCase().replace(/\s+/g, "-");

const createCartItem = (listing) => ({
  id: listing.id || buildListingId(listing),
  title: listing.title,
  price: listing.price,
  location: listing.location,
  imageUrl: listing.imageUrl,
  tag: listing.tag || "Saved",
  category: listing.category || "home",
  sellerEmail: listing.sellerEmail || "",
  sellerName: listing.sellerName || "Marketplace Seller",
  sellerPhone: listing.sellerPhone || "",
  description: listing.description || ""
});

export const addToCart = (listing) => {
  const items = getCartItems();
  const newItem = createCartItem(listing);
  
  if (items.some(item => item.id === newItem.id)) {
    return items;
  }
  
  const updated = [...items, newItem];
  saveCartItems(updated);
  return updated;
};

export const removeFromCart = (id) => {
  const updated = getCartItems().filter(item => item.id !== id);
  saveCartItems(updated);
  return updated;
};

export const clearCart = () => {
  saveCartItems([]);
  return [];
};
