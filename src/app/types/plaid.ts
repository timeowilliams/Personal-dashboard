// types/plaid.ts
export interface PlaidLinkResponse {
  public_token: string;
  metadata: {
    institution?: {
      name: string;
      institution_id: string;
    };
    accounts: Array<{
      id: string;
      name: string;
      mask: string;
      type: string;
      subtype: string;
    }>;
  };
}

export interface AccountBalance {
  account_id: string;
  balances: {
    available: number;
    current: number;
    iso_currency_code: string;
    limit?: number;
  };
  mask: string;
  name: string;
  official_name: string;
  type: string;
  subtype: string;
}

export interface PlaidError {
  error_type: string;
  error_code: string;
  error_message: string;
  display_message: string;
}