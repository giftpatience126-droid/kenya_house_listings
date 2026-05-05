const MESSAGES_KEY = "khl_secure_messages";

export function buildConversationId(listingId, firstEmail, secondEmail) {
  return [listingId, firstEmail, secondEmail].map((value) => value.toLowerCase()).sort().join("::");
}

export async function sendSecureMessage({
  listingId,
  senderEmail,
  senderName,
  recipientEmail,
  recipientName,
  text
}) {
  const conversationId = buildConversationId(listingId, senderEmail, recipientEmail);
  const encrypted = await encryptText(conversationId, text);
  const entry = {
    id: `${conversationId}-${Date.now()}`,
    listingId,
    conversationId,
    senderEmail,
    senderName,
    recipientEmail,
    recipientName,
    encrypted,
    createdAt: new Date().toISOString()
  };

  const next = [entry, ...getRawMessages()];
  window.localStorage.setItem(MESSAGES_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("messages:updated"));
  return entry;
}

export async function getConversationMessages(listingId, firstEmail, secondEmail) {
  const conversationId = buildConversationId(listingId, firstEmail, secondEmail);
  const messages = getRawMessages().filter((message) => message.conversationId === conversationId);

  return Promise.all(
    messages
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map(async (message) => ({
        ...message,
        text: await decryptText(conversationId, message.encrypted)
      }))
  );
}

export function getUserConversations(email) {
  const seen = new Map();

  for (const message of getRawMessages()) {
    if (message.senderEmail !== email && message.recipientEmail !== email) {
      continue;
    }

    if (!seen.has(message.conversationId)) {
      seen.set(message.conversationId, message);
    }
  }

  return Array.from(seen.values());
}

function getRawMessages() {
  try {
    const raw = window.localStorage.getItem(MESSAGES_KEY);
    const messages = raw ? JSON.parse(raw) : [];
    return Array.isArray(messages) ? messages : [];
  } catch (error) {
    return [];
  }
}

async function encryptText(secret, text) {
  const key = await deriveKey(secret);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );

  return {
    iv: toBase64(iv),
    data: toBase64(new Uint8Array(ciphertext))
  };
}

async function decryptText(secret, payload) {
  const key = await deriveKey(secret);
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(payload.iv) },
    key,
    fromBase64(payload.data)
  );

  return new TextDecoder().decode(decrypted);
}

async function deriveKey(secret) {
  const secretBytes = new TextEncoder().encode(secret);
  const hash = await window.crypto.subtle.digest("SHA-256", secretBytes);
  return window.crypto.subtle.importKey("raw", hash, "AES-GCM", false, ["encrypt", "decrypt"]);
}

function toBase64(bytes) {
  return window.btoa(String.fromCharCode(...bytes));
}

function fromBase64(value) {
  return Uint8Array.from(window.atob(value), (character) => character.charCodeAt(0));
}
