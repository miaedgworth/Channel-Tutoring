import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { Card, CardContent } from "@/components/ui/card";
import { AccountSettingsForm } from "@/components/account-settings-form";
import { ChangePasswordForm } from "@/components/change-password-form";

export const metadata: Metadata = { title: "Account Settings" };
export const dynamic = "force-dynamic";

export default async function TutorSettingsPage() {
  const sessionUser = await requireUser("TUTOR");
  const user = await prisma.user.findUniqueOrThrow({ where: { id: sessionUser.id } });

  return (
    <div className="max-w-xl space-y-6">
      <Card>
        <CardContent>
          <h2 className="font-heading text-lg font-semibold text-navy">
            Account details
          </h2>
          <div className="mt-4">
            <AccountSettingsForm
              name={user.name}
              email={user.email}
              phone={user.phone}
              newsletterOptIn={user.newsletterOptIn}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <h2 className="font-heading text-lg font-semibold text-navy">Password</h2>
          <div className="mt-4">
            <ChangePasswordForm />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
