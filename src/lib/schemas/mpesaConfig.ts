import { z } from "zod";

/** Safaricom Daraja credentials + paybill/till settings for the tenant. */
export const mpesaConfigSchema = z.object({
  environment: z.enum(["sandbox", "production"]),
  shortcode: z.string().trim().regex(/^\d{5,7}$/, "5–7 digit shortcode"),
  shortcode_type: z.enum(["paybill", "till"]),
  consumer_key: z.string().trim().min(10, "Consumer key required"),
  consumer_secret: z.string().trim().min(10, "Consumer secret required"),
  passkey: z.string().trim().min(10, "STK passkey required"),
  callback_url: z.string().url("Must be a valid HTTPS URL").refine(
    (u) => u.startsWith("https://"),
    { message: "Callback URL must use HTTPS" },
  ),
  validation_url: z.string().url().optional().or(z.literal("")),
  confirmation_url: z.string().url().optional().or(z.literal("")),
  account_reference_format: z.enum(["admission_number", "invoice_number", "custom"]).default("admission_number"),
});

export type MpesaConfigInput = z.infer<typeof mpesaConfigSchema>;