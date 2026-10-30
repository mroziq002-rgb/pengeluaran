const AUTH_CONFIG = Object.freeze({
    username: "Lion",
    salt: "dompetku-lion-login-v1",
    passwordHash: "VxHgcgZNqMAQEY1uW2CsKzmTQqyQ5gKQixWI6ML5nC8=",
    iterations: 100000,
    sessionKey: "dompetku_auth_session",
    sessionDurationMs: 12 * 60 * 60 * 1000
});

function bytesToBase64(bytes) {
    let binary = "";
    bytes.forEach(byte => binary += String.fromCharCode(byte));
    return btoa(binary);
}

async function hashPassword(password) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        "PBKDF2",
        false,
        ["deriveBits"]
    );
    const bits = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt: encoder.encode(AUTH_CONFIG.salt),
            iterations: AUTH_CONFIG.iterations,
            hash: "SHA-256"
        },
        keyMaterial,
        256
    );
    return bytesToBase64(new Uint8Array(bits));
}

async function verifyCredentials(username, password) {
    if (username !== AUTH_CONFIG.username) return false;
    const hash = await hashPassword(password);
    return hash === AUTH_CONFIG.passwordHash;
}

function createLoginSession() {
    sessionStorage.setItem(AUTH_CONFIG.sessionKey, JSON.stringify({
        authenticated: true,
        username: AUTH_CONFIG.username,
        expiresAt: Date.now() + AUTH_CONFIG.sessionDurationMs
    }));
}

function isLoginSessionValid() {
    try {
        const session = JSON.parse(sessionStorage.getItem(AUTH_CONFIG.sessionKey) || "null");
        return Boolean(session?.authenticated &&
            session.username === AUTH_CONFIG.username &&
            session.expiresAt > Date.now());
    } catch {
        return false;
    }
}

function requireLogin() {
    if (!isLoginSessionValid()) {
        window.location.replace("login.html");
    }
}

function logout() {
    sessionStorage.removeItem(AUTH_CONFIG.sessionKey);
    window.location.replace("login.html");
}
