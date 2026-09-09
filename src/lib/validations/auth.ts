import { z } from "zod";

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Please enter your full name").max(100),
    email: z.string().trim().toLowerCase().email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(72),
    newsletterOptIn: z.boolean().default(false),
    agreedToTerms: z.literal(true, {
      message: "You must agree to the Registration Agreement to create an account.",
    }),
    // Not persisted itself — just gates whether the address fields below
    // are required. A client who only ever has online sessions has no
    // need to give us a home address.
    hasInPersonSessions: z.boolean().default(false),
    addressLine1: z.string().trim().max(200).optional().or(z.literal("")),
    addressLine2: z.string().trim().max(200).optional().or(z.literal("")),
    addressTown: z.string().trim().max(100).optional().or(z.literal("")),
    addressPostcode: z.string().trim().max(20).optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (!data.hasInPersonSessions) return;
    if (!data.addressLine1) {
      ctx.addIssue({ code: "custom", path: ["addressLine1"], message: "Enter your address" });
    }
    if (!data.addressTown) {
      ctx.addIssue({ code: "custom", path: ["addressTown"], message: "Enter your town" });
    }
    if (!data.addressPostcode) {
      ctx.addIssue({ code: "custom", path: ["addressPostcode"], message: "Enter your postcode" });
    }
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;
