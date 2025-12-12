import type { BuildContext, Extension } from '@regent/types/core';
import type { AnalyticsRuntime } from '@regent/types/analytics';
import type { PaymentTracker } from '@regent/types/payments';

export function analytics(): Extension<AnalyticsRuntime> {
  return {
    name: 'analytics',
    build(ctx: BuildContext): AnalyticsRuntime {
      return {
        get paymentTracker() {
          return ctx.runtime.payments?.paymentTracker as
            | PaymentTracker
            | undefined;
        },
      };
    },
  };
}
