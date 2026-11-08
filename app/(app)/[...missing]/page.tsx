import { notFound } from "next/navigation";

// Any URL no other route matches lands here, so its 404 shows inside the app's nav like the rest.
// It only ever 404s, so there's no page for Next to check renders instantly.
export const instant = false;

export default function Missing() {
  notFound();
}
