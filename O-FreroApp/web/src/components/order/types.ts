/** sessionStorage key: e-mail of the last order, to prefill sign-up from the confirmation page. */
export const LAST_EMAIL_KEY = "ofrero-derniere-commande-email";

export interface CheckoutAccount {
  name: string;
  email: string;
  addresses: { id: string; label: string | null; line1: string; line2: string | null; postalCode: string; city: string; isDefault: boolean }[];
  balance: number;
  stampsForReward: number;
}

export interface AddressDraft {
  line1: string;
  line2: string;
  postalCode: string;
  city: string;
}

export interface CustomerDraft {
  firstName: string;
  phone: string;
  email: string;
}
