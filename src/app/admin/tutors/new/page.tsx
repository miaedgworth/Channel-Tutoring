import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { AddTutorForm } from "@/components/admin/add-tutor-form";

export const metadata: Metadata = { title: "Add Tutor" };

export default function AdminAddTutorPage() {
  return (
    <Card>
      <CardContent>
        <h2 className="font-heading text-lg font-semibold text-navy">Add Tutor</h2>
        <p className="mt-1 text-sm text-navy/60">
          Create a tutor account directly, without going through the
          application form.
        </p>
        <div className="mt-6 max-w-2xl">
          <AddTutorForm />
        </div>
      </CardContent>
    </Card>
  );
}
