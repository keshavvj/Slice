
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface PlaidLinkButtonProps {
    onSuccess?: () => void;
    className?: string;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export function PlaidLinkButton({ onSuccess, className, variant = 'default' }: PlaidLinkButtonProps) {
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const createLinkToken = async () => {
            try {
                const response = await fetch('/api/plaid/link-token', { method: 'POST' });
                if (!response.ok) {
                    throw new Error(`Failed to create link token: ${response.statusText}`);
                }
                const data = await response.json();
                setToken(data.link_token);
            } catch (err) {
                console.error("Link token creation failed", err);
                setError("Failed to initialize Plaid. Please refresh.");
            }
        };
        createLinkToken();
    }, []);

    const onPlaidSuccess = useCallback(async (public_token: string) => {
        setLoading(true);
        try {
            await fetch('/api/plaid/exchange', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ public_token }),
            });
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error('Error exchanging token', err);
        } finally {
            setLoading(false);
        }
    }, [onSuccess]);

    const config: Parameters<typeof usePlaidLink>[0] = {
        token,
        onSuccess: onPlaidSuccess,
    };

    const { open, ready } = usePlaidLink(config);

    return (
        <Button
            onClick={() => open()}
            disabled={!ready || loading}
            variant={variant}
            className={className}
        >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {error ? error : "Connect Bank"}
        </Button>
    );
}
