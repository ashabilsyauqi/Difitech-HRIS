import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const JWT_SECRET_STRING = process.env.JWT_SECRET || "hris_super_secret_jwt_key_2026_camstamp_secure_token";
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);
const TOKEN_COOKIE_NAME = "hris_token";

export interface TokenPayload {
  userId: string;
  id?: string;
  email: string;
  name: string;
  role: string; // ADMIN, MANAGER, EMPLOYEE
  department?: string | null;
  jobTitle?: string | null;
}

export async function signToken(payload: TokenPayload): Promise<string> {
  const tokenPayload = {
    ...payload,
    id: payload.userId || payload.id,
    userId: payload.userId || payload.id,
  };
  return new SignJWT(tokenPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const parsed = payload as unknown as TokenPayload;
    return {
      ...parsed,
      id: parsed.userId || parsed.id,
      userId: parsed.userId || parsed.id,
    };
  } catch {
    return null;
  }
}

export async function getAuthenticatedUser(req?: NextRequest): Promise<TokenPayload | null> {
  let token: string | undefined;

  if (req) {
    // 1. Check Authorization header
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
    // 2. Check cookies from req
    if (!token) {
      token = req.cookies.get(TOKEN_COOKIE_NAME)?.value;
    }
  }

  // 3. Check Next.js cookies store
  if (!token) {
    try {
      const cookieStore = cookies();
      token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;
    } catch {
      // Cookies not accessible in some edge context
    }
  }

  if (!token) return null;
  return await verifyToken(token);
}

/**
 * Alias for getAuthenticatedUser for broad compatibility
 */
export async function getCurrentUser(req?: NextRequest): Promise<TokenPayload | null> {
  return getAuthenticatedUser(req);
}

export { TOKEN_COOKIE_NAME };
