// lib/nessie.ts

// Client-side wrapper for calling internal Nessie proxy routes

export type NessieCustomer = {
    _id: string;
    first_name: string;
    last_name: string;
    address: {
        street_number: string;
        street_name: string;
        city: string;
        state: string;
        zip: string;
    };
};

export type NessieAccount = {
    _id: string;
    type: string;
    nickname: string;
    rewards: number;
    balance: number;
    account_number: string;
    customer_id: string;
};

// Common shape for simplified handling
export type NessieActivity = {
    _id: string;
    type: string;
    status: string;
    payer_id?: string;
    payee_id?: string;
    amount: number;
    description?: string;
    merchant_id?: string; // for purchases
    purchase_date?: string; // for purchases
    transaction_date?: string; // for transfers/deposits
    date?: string; // fallback
};

export type NessieBill = {
    _id: string;
    status: string;
    payee: string;
    nickname: string;
    payment_date: string;
    recurring_date: number;
    payment_amount: number;
    account_id: string;
};

// Internal API helpers
export async function fetchInternal(endpoint: string, debug = false) {
    const separator = endpoint.includes('?') ? '&' : '?';
    const url = `/api/nessie/${endpoint}${debug ? `${separator}debug=1` : ''}`;

    const res = await fetch(url);
    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || `Failed to fetch ${endpoint} (Status: ${res.status})`);
    }
    return res.json();
}

export const nessieClient = {
    getCustomers: async (debug = false) => {
        return fetchInternal('customers', debug);
    },

    getAccounts: async (customerId: string, debug = false) => {
        return fetchInternal(`accounts?customerId=${customerId}`, debug);
    },

    getPurchases: async (accountId: string, debug = false) => {
        return fetchInternal(`transactions?accountId=${accountId}`, debug);
    },

    getTransfers: async (accountId: string, debug = false) => {
        return fetchInternal(`transfers?accountId=${accountId}`, debug);
    },

    getDeposits: async (accountId: string, debug = false) => {
        return fetchInternal(`deposits?accountId=${accountId}`, debug);
    },

    getBills: async (accountId: string, debug = false) => {
        return fetchInternal(`bills?accountId=${accountId}`, debug);
    }
};
