import { decodePaymentRequiredHeader } from "@x402/core/http";
import type { PaymentRequired } from "@x402/core/types";

export function tryDecodePaymentRequiredHeaderValue(
  paymentRequiredHeaderValue: string,
): PaymentRequired | undefined {
  try {
    return decodePaymentRequiredHeader(paymentRequiredHeaderValue);
  } catch {
    return undefined;
  }
}

export function tryGetPaymentRequiredFromResponse(response: Response): PaymentRequired | undefined {
  const headerValue = response.headers.get("PAYMENT-REQUIRED");
  if (!headerValue) return undefined;
  return tryDecodePaymentRequiredHeaderValue(headerValue);
}



