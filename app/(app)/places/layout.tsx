import { connection } from "next/server";
import { Suspense } from "react";
import { getDb } from "@/lib/db";
import { listPlaces } from "@/lib/places";
import { DeskMap } from "./places-view";

async function Map() {
  await connection(); // read the database per request, not at build time
  return <DeskMap places={listPlaces(getDb())} />;
}

// On desktop the map stays on screen for every /places route, with the list or a form beside it.
// Keeping it in this layout means it isn't rebuilt between them.
export default function PlacesLayout({ children }: LayoutProps<"/places">) {
  return (
    <div className="desk:flex desk:h-dvh">
      <div className="desk:w-90 desk:shrink-0 desk:overflow-y-auto desk:border-r desk:border-line">{children}</div>
      <Suspense>
        <Map />
      </Suspense>
    </div>
  );
}
