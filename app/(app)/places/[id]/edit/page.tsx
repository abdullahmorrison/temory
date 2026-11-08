import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { editPlace, removePlace } from "@/app/(app)/places/actions";
import { BackLink } from "@/components/back-link";
import { ConfirmDelete } from "@/components/confirm-delete";
import { PlaceForm } from "@/components/place-form";
import { getDb } from "@/lib/db";
import { listPeople } from "@/lib/people";
import { getPlace, listPlaces, placesCentre } from "@/lib/places";

async function Edit({ params }: { params: Promise<{ id: string }> }) {
  await connection(); // read the database per request, not at build time
  const id = Number((await params).id);
  const place = Number.isInteger(id) ? getPlace(getDb(), id) : undefined;
  if (!place) notFound();
  const defaults = { ...place, personIds: place.people.map((p) => p.id) };
  return (
    <>
      <BackLink href={`/places?place=${place.id}`} label={`Back to ${place.title}`} everywhere />
      <h1 className="mt-6 mb-9 text-2xl font-medium desk:mt-4 desk:text-[1.375rem]">Edit place</h1>
      {/* Keyed by what's saved: Next keeps a left page alive with its state, so a reopened form would hold the values from before. */}
      <PlaceForm key={JSON.stringify(defaults)} action={editPlace.bind(null, place.id)} people={listPeople(getDb())} around={placesCentre(listPlaces(getDb()))} submitLabel="Save" defaults={defaults} />
      <div className="mt-14 border-t border-line pt-6">
        <ConfirmDelete label="Delete place" warning={`Delete ${place.title}? The people stay.`} action={removePlace.bind(null, place.id)} />
      </div>
    </>
  );
}

export default function EditPlacePage(props: PageProps<"/places/[id]/edit">) {
  return (
    <div className="mx-auto max-w-xl px-7 pt-12 pb-10 desk:px-6 desk:pt-8">
      <Suspense>
        <Edit params={props.params} />
      </Suspense>
    </div>
  );
}
