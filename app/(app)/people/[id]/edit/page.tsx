import { Suspense } from "react";
import { editPerson, removePerson } from "@/app/(app)/people/actions";
import { BackLink } from "@/components/back-link";
import { ConfirmDelete } from "@/components/confirm-delete";
import { Panel } from "@/components/panel";
import { PersonForm } from "@/components/person-form";
import { signedIn } from "@/lib/session";
import { listTypes } from "@/lib/relationship-types";
import { personFromParams } from "../data";

async function Edit({ params }: { params: Promise<{ id: string }> }) {
  const my = await signedIn();
  const person = await personFromParams(params);
  // Only the form's own fields, so changing the person's type from the dropdown (its badge emoji) doesn't reset the form.
  const defaults = { id: person.id, name: person.name, closeness: person.closeness, typeId: person.typeId, notes: person.notes };
  return (
    <Panel close={{ href: `/people/${person.id}`, label: `Back to ${person.name}` }}>
      <BackLink href={`/people/${person.id}`} label={`Back to ${person.name}`} />
      <h1 className="mt-6 mb-10 pr-10 text-2xl font-medium desk:mt-0 desk:mb-9 desk:text-[1.375rem]">Edit {person.name}</h1>
      {/* Keyed by what's saved: Next keeps a left page alive with its state, so a reopened form would hold the values from before. */}
      <PersonForm key={JSON.stringify(defaults)} action={editPerson.bind(null, person.id)} submitLabel="Save" color={person.color} types={listTypes(my)} defaults={defaults} />
      <div className="mt-14 border-t border-line pt-6">
        <ConfirmDelete
          label={`Delete ${person.name}`}
          warning={`Delete ${person.name}? Their moments stay in your journal.`}
          action={removePerson.bind(null, person.id)}
        />
      </div>
    </Panel>
  );
}

export default function EditPersonPage(props: PageProps<"/people/[id]/edit">) {
  return (
    <Suspense>
      <Edit params={props.params} />
    </Suspense>
  );
}
