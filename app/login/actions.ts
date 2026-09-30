'use server'

// Login is now handled client-side in page.tsx via direct browser fetch to /api/auth/login.
// This ensures FastAPI's Set-Cookie header is received by the browser directly,
// instead of being absorbed by a Next.js server action and never forwarded.

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  'http://localhost:9018'

export async function logout() {
  try {
    await fetch(`${BACKEND_URL}/api/auth/logout`, {
      method:      'POST',
      credentials: 'include',
      cache:       'no-store',
    })
  } catch {
    // Swallow network errors — cookie will expire naturally
  }
  return { success: true }
}
