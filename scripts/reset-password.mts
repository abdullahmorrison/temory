// Sets a new password for an account, from the server's command line, and signs it out everywhere.
// There's no reset by email yet, so this is how a forgotten password is changed.
//
//   node scripts/reset-password.mts someone@example.com
//
// Plain Node runs it (no build step), so it reads the database directly rather than through the app.
import { createInterface } from "node:readline/promises";
import Database from "better-sqlite3";
import { hashPassword, MIN_PASSWORD_LENGTH } from "../lib/password.ts";

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Usage: node scripts/reset-password.mts <email>");
  process.exit(1);
}

const db = new Database(process.env.DATABASE_PATH ?? "data/crm.db");
const user = db.prepare("SELECT id, name FROM users WHERE email = ?").get(email) as { id: number; name: string } | undefined;
if (!user) {
  console.error(`No account has the email ${email}.`);
  process.exit(1);
}

const prompt = createInterface({ input: process.stdin, output: process.stdout });
const password = await prompt.question(`New password for ${user.name}: `);
prompt.close();
if (password.length < MIN_PASSWORD_LENGTH) {
  console.error(`Use at least ${MIN_PASSWORD_LENGTH} characters.`);
  process.exit(1);
}

db.transaction(() => {
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hashPassword(password), user.id);
  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(user.id); // whoever had the old password is signed out
})();
console.log(`Done. ${user.name} can sign in with the new password.`);
