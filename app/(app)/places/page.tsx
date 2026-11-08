import { connection } from "next/server";
import { Suspense } from "react";
import { signedIn } from "@/lib/session";
import { listPlaces } from "@/lib/places";
import { PlacesHome } from "./places-view";

async function Home() {
  await connection(); // read the database per request, not at build time
  const my = await signedIn();
  return <PlacesHome places={listPlaces(my)} />;
}

export default function PlacesPage() {
  return (
    <Suspense>
      <Home />
    </Suspense>
  );
}
