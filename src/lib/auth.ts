import { SignJWT, jwtVerify } from "jose";
import { SessionUser } from "@/types/domain";

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "local-dev-secret");

export async function createSessionToken(user: SessionUser) {
  return new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret);
}

export async function readSessionToken(token: string) {
  const result = await jwtVerify<SessionUser>(token, secret);
  return result.payload;
}

export function isManager(user?: SessionUser | null) {
  return user?.role === "MANAGER";
}
