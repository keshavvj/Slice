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

export async function postInternal(endpoint: string, body: any) {
    console.log(`[Nessie Client] Posting to ${endpoint}:`, body);
    const url = `/api/nessie/${endpoint}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || `Failed to post to ${endpoint} (Status: ${res.status})`);
    }
    const data = await res.json();
    console.log(`[Nessie Client] Response from ${endpoint}:`, data);
    return data;
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

    createPurchase: async (accountId: string, purchase: { merchant_id?: string, medium?: string, amount: number, description?: string, purchase_date?: string }) => {
        return postInternal(`transactions?accountId=${accountId}`, {
            medium: 'balance',
            status: 'pending',
            purchase_date: new Date().toISOString().split('T')[0],
            ...purchase
        });
    },

    createTransfer: async (accountId: string, transfer: { medium: string, payee_id: string, amount: number, transaction_date?: string, description?: string }) => {
        return postInternal(`transfers?accountId=${accountId}`, {
            status: 'pending',
            transaction_date: new Date().toISOString().split('T')[0],
            ...transfer
        });
    },

    getTransfers: async (accountId: string, debug = false) => {
        return fetchInternal(`transfers?accountId=${accountId}`, debug);
    },

    createDeposit: async (accountId: string, deposit: { medium: string, amount: number, description?: string, transaction_date?: string }) => {
        return postInternal(`deposits?accountId=${accountId}`, {
            status: 'pending', // Deposits also typically default closely to cleared but pending is safe for creation
            transaction_date: new Date().toISOString().split('T')[0],
            ...deposit
        });
    },

    getDeposits: async (accountId: string, debug = false) => {
        return fetchInternal(`deposits?accountId=${accountId}`, debug);
    },

    getBills: async (accountId: string, debug = false) => {
        return fetchInternal(`bills?accountId=${accountId}`, debug);
    }
};
