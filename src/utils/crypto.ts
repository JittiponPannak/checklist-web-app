const SECRET_KEY = "EATER_EGG_FRESH_MART_SECRET_KEY";

export function encryptData(text: string): string {
    try {
        const textBytes = new TextEncoder().encode(text);
        const keyBytes = new TextEncoder().encode(SECRET_KEY);
        const encryptedBytes = new Uint8Array(textBytes.length);
        for (let i = 0; i < textBytes.length; i++) {
            encryptedBytes[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
        }
        return btoa(String.fromCharCode.apply(null, Array.from(encryptedBytes)));
    } catch (err) {
        return text;
    }
}

export function decryptData(encoded: string): string {
    try {
        // If it's literally plain JSON (legacy), atob will likely fail and fallback to returning it.
        const encryptedString = atob(encoded);
        const encryptedBytes = new Uint8Array(encryptedString.length);
        for (let i = 0; i < encryptedString.length; i++) {
            encryptedBytes[i] = encryptedString.charCodeAt(i);
        }

        const keyBytes = new TextEncoder().encode(SECRET_KEY);
        const decryptedBytes = new Uint8Array(encryptedBytes.length);
        for (let i = 0; i < encryptedBytes.length; i++) {
            decryptedBytes[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
        }
        return new TextDecoder().decode(decryptedBytes);
    } catch (err) {
        // Fallback to original text if error (e.g., trying to decrypt unencrypted JSON)
        return encoded;
    }
}

export function secureSetItem(key: string, value: string) {
    if (typeof window !== "undefined") {
        localStorage.setItem(key, encryptData(value));
    }
}

export function secureGetItem(key: string): string | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return decryptData(raw);
}

export function secureRemoveItem(key: string) {
    if (typeof window !== "undefined") {
        localStorage.removeItem(key);
    }
}
