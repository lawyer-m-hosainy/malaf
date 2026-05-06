import { auth } from "./firebase";

async function getAuthHeaders() {
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  };
}

const API_URL = import.meta.env.VITE_APP_URL || "http://localhost:3005";

export async function encryptField(value: string | undefined | null): Promise<string> {
  if (!value) return "";
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/crypto/encrypt`, {
      method: "POST",
      headers,
      body: JSON.stringify({ text: value }),
    });
    if (!response.ok) throw new Error("Encryption failed");
    const data = await response.json();
    return data.result || "";
  } catch (error) {
    console.error("Encryption failed:", error);
    return "";
  }
}

export async function decryptField(encryptedValue: string | undefined | null): Promise<string> {
  if (!encryptedValue) return "";
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/crypto/decrypt`, {
      method: "POST",
      headers,
      body: JSON.stringify({ text: encryptedValue }),
    });
    if (!response.ok) throw new Error("Decryption failed");
    const data = await response.json();
    return data.result || encryptedValue; 
  } catch (error) {
    console.error("Decryption failed:", error);
    return encryptedValue; 
  }
}

