declare module "@cashfreepayments/cashfree-js" {
  export interface CashfreeOptions {
    mode: "sandbox" | "production";
  }

  export interface CheckoutOptions {
    paymentSessionId?: string;
    subsSessionId?: string;
    redirectTarget?: "_self" | "_blank" | "_top";
  }

  export interface Cashfree {
    checkout(options: CheckoutOptions): Promise<any>;
    subscriptionsCheckout(options: CheckoutOptions): Promise<any>;
  }

  export function load(options: CashfreeOptions): Promise<Cashfree>;
}
