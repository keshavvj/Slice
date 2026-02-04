'use client';

import * as React from 'react';
import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUser } from '@auth0/nextjs-auth0/client';

export default function SettingsPage() {
    const { user: auth0User } = useUser();
    const userStore = useStore();
    const { user, updateUserParams, resetAll } = userStore;

    React.useEffect(() => {
        // Sync Auth0 name to Store if using default seed user
        if (auth0User?.name && user.name === "Jordan Lee") {
            updateUserParams({ name: auth0User.name });
        }
    }, [auth0User, user.name, updateUserParams]);

    // Handle Management
    const [handleInput, setHandleInput] = React.useState("");
    const [isUpdatingHandle, setIsUpdatingHandle] = React.useState(false);

    // Initial fetch of handle from DB via health check or profile
    // For now, we rely on what we have, but we should fetch the latest handle
    React.useEffect(() => {
        // Fetch current handle from verification endpoint
        fetch('/api/health/auth').then(res => res.json()).then(data => {
            if (data.handle) {
                setHandleInput(data.handle);
                updateUserParams({ handle: data.handle });
            } else if (auth0User?.nickname) {
                // Fallback if DB doesn't have it yet? but requireUser guarantees it
            }
        });
    }, []);

    const updateHandle = async () => {
        if (!handleInput || handleInput.length < 3) return;
        setIsUpdatingHandle(true);
        try {
            const res = await fetch('/api/user/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ handle: handleInput })
            });
            const data = await res.json();
            if (res.ok) {
                alert("Handle updated!");
                updateUserParams({ handle: handleInput });
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (err) {
            alert("Failed to update handle");
        } finally {
            setIsUpdatingHandle(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        Bank Integration
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <BankSettings />
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Profile & Preferences</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1">
                        <Label htmlFor="handle">Slice Handle</Label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-2.5 text-muted-foreground">@</span>
                                <Input
                                    id="handle"
                                    value={handleInput}
                                    onChange={(e) => setHandleInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                                    className="pl-7"
                                    placeholder="your_handle"
                                />
                            </div>
                            <Button
                                onClick={updateHandle}
                                disabled={isUpdatingHandle || handleInput === (auth0User?.nickname || user.handle)}
                                variant="outline"
                            >
                                {isUpdatingHandle ? "Saving..." : "Update"}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Unique handle for friends to find you. 3-20 characters.
                        </p>
                    </div>

                    <div className="space-y-1">
                        <Label htmlFor="name">Display Name</Label>
                        <Input id="name" defaultValue={user?.name || auth0User?.name || ''} disabled />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" defaultValue={user?.email || auth0User?.email || ''} disabled />
                    </div>
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Safe-to-Spend Buffer ($)</label>
                        <Input
                            type="number"
                            value={user.safetyThreshold}
                            onChange={(e) => updateUserParams({ safetyThreshold: Number(e.target.value) })}
                        />
                    </div>
                    <div className="pt-4">
                        <Button variant="destructive" onClick={() => resetAll()}>
                            Reset All Data
                        </Button>
                    </div>
                </CardContent>
            </Card>


            {/* Debug Panel Removed */}
        </div>
    );
}

function BankSettings() {
    const [connections, setConnections] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [refreshing, setRefreshing] = React.useState(false);

    const fetchSummary = React.useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/banking/summary');
            if (res.ok) {
                const data = await res.json();
                setConnections(data.connections || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await fetch('/api/plaid/sync', { method: 'POST' });
            await fetchSummary();
        } catch (e) {
            console.error(e);
        } finally {
            setRefreshing(false);
        }
    };

    if (loading && connections.length === 0) {
        return <div className="text-sm text-muted-foreground">Loading bank details...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-4">
                {connections.length === 0 ? (
                    <div className="flex flex-col gap-2">
                        <p className="text-sm text-muted-foreground">
                            No banks connected. Connect your bank account to sync transactions.
                        </p>
                        <div className="flex gap-2">
                            <PlaidLinkButton onSuccess={fetchSummary} />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {connections.map((conn) => (
                            <div key={conn.id} className="border rounded-lg p-3 space-y-2">
                                <div className="flex justify-between items-center">
                                    <div className="font-medium">{conn.institutionName || 'Bank Account'}</div>
                                    <div className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 capitalize">
                                        {conn.status}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    {conn.accounts?.map((acc: any) => (
                                        <div key={acc.id} className="text-sm flex justify-between text-muted-foreground">
                                            <span>{acc.name} (xxxx{acc.mask})</span>
                                            <span>${acc.balance?.toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="text-xs text-muted-foreground pt-1">
                                    Last synced: {conn.lastSyncAt ? new Date(conn.lastSyncAt).toLocaleString() : 'Never'}
                                </div>
                            </div>
                        ))}

                        <div className="flex gap-2">
                            <PlaidLinkButton onSuccess={fetchSummary} variant="outline" className="w-full sm:w-auto" />
                            <Button
                                onClick={handleRefresh}
                                disabled={refreshing}
                                variant="secondary"
                            >
                                {refreshing ? "Syncing..." : "Refresh Data"}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Import PlaidLinkButton dynamically or normally if it's client component
import { PlaidLinkButton } from '@/components/plaid-link';
