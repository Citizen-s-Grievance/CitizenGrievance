/* ═══════════════════════════════════════════════════════════
   authCookie.js
   Central helper for reading/writing the auth JWT cookie.

   USAGE IN ANY COMPONENT / SERVICE:
   ──────────────────────────────────
   import { getAuthToken, getAuthRole, clearAuthCookies, isLoggedIn } from "../utils/authCookie";

   // Attach to every protected API call:
   const res = await fetch("http://localhost:8080/some-protected-route", {
     method: "GET",
     headers: {
       "Authorization": getAuthToken(),   // "Bearer eyJhbGci..."
       "Content-Type": "application/json",
     },
   });

   // Logout:
   clearAuthCookies();
   navigate("/login");
   ═══════════════════════════════════════════════════════════ */

const TOKEN_COOKIE = "auth_token";
const ROLE_COOKIE = "auth_role";
const MAX_AGE_2HR = 2 * 60 * 60; // seconds — matches backend "expiresIn: 2 hours"

/** Read a raw cookie value by name. Returns null if absent or expired. */
function getCookie(name) {
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(name + "="));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

/**
 * Save the JWT token + role into cookies.
 * Called automatically by Login.jsx on successful login.
 * @param {string} token  Full value, e.g. "Bearer eyJhbGciOiJIUzI1NiJ9..."
 * @param {string} role   "ROLE_USER" | "ROLE_ADMIN"
 */
export function saveAuthCookie(token, role) {
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; max-age=${MAX_AGE_2HR}; path=/; SameSite=Strict`;
  document.cookie = `${ROLE_COOKIE}=${role}; max-age=${MAX_AGE_2HR}; path=/; SameSite=Strict`;
}

/**
 * Returns the full Authorization header value, e.g. "Bearer eyJhbGci..."
 * Pass this directly as the Authorization header in fetch() calls.
 * Returns null if the user is not logged in / cookie expired.
 */
export function getAuthToken() {
  return getCookie(TOKEN_COOKIE);
}

/**
 * Returns "ROLE_USER" or "ROLE_ADMIN".
 * Returns null if not logged in.
 */
export function getAuthRole() {
  return getCookie(ROLE_COOKIE);
}

/**
 * Returns true if the auth cookie is present (i.e. user is logged in
 * and the 2-hour cookie hasn't expired yet).
 */
export function isLoggedIn() {
  return !!getAuthToken();
}

/**
 * Clears both auth cookies immediately.
 * Call this on logout.
 */
export function clearAuthCookies() {
  document.cookie = `${TOKEN_COOKIE}=; max-age=0; path=/`;
  document.cookie = `${ROLE_COOKIE}=; max-age=0; path=/`;
}

/**
 * Convenience: returns the default headers object for authenticated requests.
 * Usage:
 *   const res = await fetch(url, { method: "GET", headers: authHeaders() });
 */
export function authHeaders(extra = {}) {
  return {
    "Content-Type": "application/json",
    Authorization: getAuthToken() ?? "",
    ...extra,
  };
}
