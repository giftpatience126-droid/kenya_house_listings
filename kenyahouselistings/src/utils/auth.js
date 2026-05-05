const SESSION_KEY = "khl_auth_session";
const USERS_KEY = "khl_users";

const storage = {
  get: (key) => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
  remove: (key) => localStorage.removeItem(key)
};

const emitAuthEvent = () => window.dispatchEvent(new CustomEvent("auth:updated"));
const emitUsersEvent = () => window.dispatchEvent(new CustomEvent("users:updated"));

export const getSession = () => storage.get(SESSION_KEY);
export const saveSession = (session) => {
  storage.set(SESSION_KEY, session);
  emitAuthEvent();
};
export const clearSession = () => {
  storage.remove(SESSION_KEY);
  emitAuthEvent();
};

export const getUsers = () => {
  const users = storage.get(USERS_KEY) || [];
  return Array.isArray(users) ? users : [];
};

export const saveUser = (user) => {
  const users = getUsers().filter(u => u.email !== user.email);
  users.push(user);
  storage.set(USERS_KEY, users);
  emitUsersEvent();
};

export const findUserByEmail = (email) => 
  getUsers().find(u => u.email?.toLowerCase() === email?.toLowerCase()) || null;

export const updateUser = (email, updates) => {
  const existing = findUserByEmail(email);

  if (!existing) {
    return null;
  }

  const updatedUser = { ...existing, ...updates };
  saveUser(updatedUser);

  const session = getSession();
  if (session?.email?.toLowerCase() === email?.toLowerCase()) {
    saveSession(buildSessionFromUser(updatedUser));
  }

  return updatedUser;
};

export const buildSessionFromUser = (user) => ({
  name: user.name,
  email: user.email,
  phone: user.phone || "",
  role: user.role,
  plan: user.plan || "free",
  subscriptionStatus: user.subscriptionStatus || "active",
  sellerAdminPassword: user.sellerAdminPassword || "",
  sellerCode: user.sellerCode || "",
  hasPaidListingFee: user.hasPaidListingFee === true,
  premiumActivatedAt: user.premiumActivatedAt || "",
  premiumTransactionId: user.premiumTransactionId || ""
});

export const isPremiumSession = (session) => session?.plan === "premium";

export const hasPaidListingFee = (session) => {
  return session?.hasPaidListingFee === true;
};

export const hasPaidPremiumFee = (session) => {
  return session?.hasPaidPremiumFee === true;
};

export const setListingFeePaid = () => {
  const session = getSession();
  if (session) {
    saveSession({ ...session, hasPaidListingFee: true });
  }
};

export const setPremiumFeePaid = () => {
  const session = getSession();
  if (session) {
    saveSession({ ...session, hasPaidPremiumFee: true, plan: 'premium' });
  }
};

export const activatePremiumForEmail = (email, payment = {}) => {
  const existing = findUserByEmail(email);
  const session = getSession();

  if (!existing && session?.email?.toLowerCase() === email?.toLowerCase()) {
    const upgradedSession = {
      ...session,
      plan: "premium",
      subscriptionStatus: "active",
      premiumActivatedAt: payment.activatedAt || new Date().toISOString(),
      premiumTransactionId: payment.transactionId || ""
    };
    saveSession(upgradedSession);
    return upgradedSession;
  }

  if (!existing) {
    return null;
  }

  return updateUser(email, {
    plan: "premium",
    subscriptionStatus: "active",
    premiumActivatedAt: payment.activatedAt || new Date().toISOString(),
    premiumTransactionId: payment.transactionId || existing.premiumTransactionId || ""
  });
};
