import { connection } from "next/server";
import { Suspense } from "react";
import { addPerson } from "@/app/(app)/people/actions";
import { BackLink } from "@/components/back-link";
import { Panel } from "@/components/panel";
import { PersonForm } from "@/components/person-form";
import { getDb } from "@/lib/db";
import { nextPersonColor } from "@/lib/people";
import { listTypes } from "@/lib/relationship-types";

async function Form() {
  await connection(); // read the database per request, not at build time
  return <PersonForm action={addPerson} submitLabel="Add person" color={nextPersonColor(getDb())} types={listTypes(getDb())} />;
}

export default function NewPersonPage() {
  return (
    <Panel close={{ href: "/people", label: "Close" }}>
      <BackLink href="/people" label="Back to people" />
      <h1 className="mt-6 mb-10 pr-10 text-2xl font-medium desk:mt-0 desk:mb-9 desk:text-[1.375rem]">Add a person</h1>
      <Suspense>
        <Form />
      </Suspense>
    </Panel>
  );
}
