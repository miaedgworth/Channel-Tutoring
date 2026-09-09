import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { Card, CardContent } from "@/components/ui/card";
import { AccountSettingsForm } from "@/components/account-settings-form";
import { AddressForm } from "@/components/address-form";
import { ChangePasswordForm } from "@/components/change-password-form";

export const metadata: Metadata = { title: "Account Settings" };
export const dynamic = "force-dynamic";

export default async function ClientSettingsPage() {
  const sessionUser = await requireUser("CLIENT");
  const user = await prisma.user.findUniqueOrThrow({ where: { id: sessionUser.id } });

  const addressRequested = !!user.addressRequestedAt && !user.addressLine1;

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
          <h2 className="font-heading text-lg font-semibold text-navy">Address</h2>
          <p className="mt-1 text-sm text-navy/60">
            Only needed if you have in-person sessions — we share it with
            your tutor once a session is confirmed.
          </p>
          {addressRequested && (
            <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
              We&apos;ve asked you to add or check your address below.
            </p>
          )}
          <div className="mt-4">
            <AddressForm
              addressLine1={user.addressLine1}
              addressLine2={user.addressLine2}
              addressTown={user.addressTown}
              addressPostcode={user.addressPostcode}
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
