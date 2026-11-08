import { connection } from "next/server";
import { Suspense } from "react";
import { getDb } from "@/lib/db";
import { listPlaces } from "@/lib/places";
import { PlacesHome } from "./places-view";

async function Home() {
  await connection(); // read the database per request, not at build time
  return <PlacesHome places={listPlaces(getDb())} />;
}

export default function PlacesPage() {
  return (
    <Suspense>
      <Home />
    </Suspense>
  );
}
