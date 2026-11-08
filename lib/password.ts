// Password hashing with Node's built-in scrypt. Standalone (no app imports) so the server's
// reset-password script can use it too.
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const N = 16384; // scrypt's cost; stored with each hash so it can be raised later
const R = 8;
const P = 1;
const KEY_LENGTH = 64;

export const MIN_PASSWORD_LENGTH = 8;

/** A salted hash to store, as `scrypt$N$r$p$salt$hash`. */
export function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEY_LENGTH, { N, r: R, p: P });
  return ["scrypt", N, R, P, salt.toString("base64"), hash.toString("base64")].join("$");
}

/** Whether `password` is the one `stored` was made from. Takes as long whether it matches or not. */
export function verifyPassword(password: string, stored: string) {
  const [scheme, n, r, p, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64");
  const actual = scryptSync(password, Buffer.from(salt, "base64"), expected.length, { N: Number(n), r: Number(r), p: Number(p) });
  return timingSafeEqual(actual, expected);
}
