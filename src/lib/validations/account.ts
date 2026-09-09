import { z } from "zod";

export const updateAccountSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  newsletterOptIn: z.boolean(),
});

export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;

export const updateAddressSchema = z.object({
  addressLine1: z.string().trim().min(1, "Enter your address").max(200),
  addressLine2: z.string().trim().max(200).optional().or(z.literal("")),
  addressTown: z.string().trim().min(1, "Enter your town").max(100),
  addressPostcode: z.string().trim().min(1, "Enter your postcode").max(20),
});

export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(8, "New password must be at least 8 characters").max(72),
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
