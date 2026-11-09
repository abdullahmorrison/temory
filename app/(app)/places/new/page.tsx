import { connection } from "next/server";
import { Suspense } from "react";
import { addPlace } from "@/app/(app)/places/actions";
import { BackLink } from "@/components/back-link";
import { PlaceForm } from "@/components/place-form";
import { signedIn } from "@/lib/session";
import { listPeople } from "@/lib/people";
import { listPlaces, placesCentre } from "@/lib/places";

async function Form() {
  await connection(); // read the database per request, not at build time
  const my = await signedIn();
  return <PlaceForm action={addPlace} people={listPeople(my)} around={placesCentre(listPlaces(my))} submitLabel="Add place" />;
}

export default function NewPlacePage() {
  return (
    <div className="mx-auto max-w-xl px-7 pt-12 pb-10 desk:px-6 desk:pt-8">
      <BackLink href="/places" label="Back to places" everywhere />
      <h1 className="mt-6 mb-9 text-2xl font-medium desk:mt-4 desk:text-[1.375rem]">Add a place</h1>
      <Suspense>
        <Form />
      </Suspense>
    </div>
  );
}
