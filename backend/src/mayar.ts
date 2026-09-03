import { z } from "zod";
import { env } from "./config.js";
import { ApiError } from "./http.js";

const invoiceResponseSchema = z.object({
  statusCode: z.number(),
  messages: z.string().optional(),
  data: z.object({
    id: z.string(),
    transactionId: z.string(),
    link: z.string().url(),
    expiredAt: z.number().optional(),
  }),
});

const invoiceDetailSchema = z.object({
  statusCode: z.number(),
  data: z.object({
    id: z.string(),
    amount: z.number(),
    status: z.string(),
    transactionId: z.string().optional(),
  }),
});

async function mayarRequest(path: string, init: RequestInit) {
  if (!env.MAYAR_API_KEY) throw new ApiError(503, "PAYMENT_NOT_CONFIGURED", "Layanan pembayaran belum dikonfigurasi.");
  const response = await fetch(`${env.MAYAR_API_URL}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${env.MAYAR_API_KEY}`, "Content-Type": "application/json", ...init.headers },
    signal: AbortSignal.timeout(15_000),
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(502, "PAYMENT_PROVIDER_ERROR", "Mayar tidak dapat memproses permintaan.", body);
  return body;
}

export async function createInvoice(input: {
  name: string; email: string; mobile: string; description: string; amount: number;
  redirectUrl: string; expiresAt: Date; reference: string; kind: "BOOKING" | "SUBSCRIPTION";
}) {
  const body = await mayarRequest("/invoice/create", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      email: input.email,
      mobile: input.mobile,
      redirectUrl: input.redirectUrl,
      description: input.description,
      expiredAt: input.expiresAt.toISOString(),
      items: [{ quantity: 1, rate: input.amount, description: input.description }],
      extraData: { noCustomer: input.reference, idProd: `${input.kind}:${input.reference}` },
    }),
  });
  return invoiceResponseSchema.parse(body).data;
}

export async function getInvoice(invoiceId: string) {
  const body = await mayarRequest(`/invoice/${encodeURIComponent(invoiceId)}`, { method: "GET" });
  return invoiceDetailSchema.parse(body).data;
}

