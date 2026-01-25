'use client';

import * as React from 'react';
import { useSession } from "next-auth/react";
import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SettingsPage() {
    const userStore = useStore();
    const { user, updateUserParams, nessieConnected, selectedCustomerId, selectedAccountId, lastFetchedAt, syncNessieData, resetAll } = userStore;
    const [isSyncing, setIsSyncing] = React.useState(false);
    const { data: session } = useSession();

    React.useEffect(() => {
        if (session?.user?.name && user.name === "Jordan Lee") {
            updateUserParams({ name: session.user.name });
        }
    }, [session, user.name, updateUserParams]);

    const handleSync = async () => {
        setIsSyncing(true);
        await syncNessieData(true); // Always force sync on manual button press
        setIsSyncing(false);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        Bank Integration
                        {user.name && nessieConnected && (
                            <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                                Connected
                            </span>
                        )}
                        {!nessieConnected && (
                            <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                Demo Mode
                            </span>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                        {nessieConnected
                            ? `Synced with Capital One (${selectedCustomerId})`
                            : "Using simulated data. Add NESSIE_API_KEY to connect."}
                    </div>

                    <div className="flex gap-4">
                        <Button
                            onClick={handleSync}
                            disabled={isSyncing}
                            className="w-full sm:w-auto"
                        >
                            {isSyncing ? "Syncing..." : "Refresh Bank Data"}
                        </Button>
                    </div>

                    {lastFetchedAt && (
                        <p className="text-xs text-muted-foreground">
                            Last synced: {new Date(lastFetchedAt).toLocaleString()}
                        </p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Profile & Preferences</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <label className="text-sm font-medium">Name</label>
                        <Input value={user.name} onChange={(e) => updateUserParams({ name: e.target.value })} />
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

            {/* Debug Panel - Only for Hackathon/Dev */}
            <Card className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/10">
                <CardHeader>
                    <CardTitle className="text-yellow-700 dark:text-yellow-500 font-mono text-lg flex items-center gap-2">
                        🐞 Debug Panel
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 font-mono text-xs">
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <span className="font-bold">Fetched:</span> {lastFetchedAt ? new Date(lastFetchedAt).toLocaleTimeString() : 'Never'}
                        </div>
                        <div>
                            <span className="font-bold">Connected:</span> {nessieConnected ? 'YES' : 'NO'}
                        </div>
                        <div>
                            <span className="font-bold">Cust ID:</span> {selectedCustomerId || 'None'}
                        </div>
                        <div>
                            <span className="font-bold">Acc ID:</span> {selectedAccountId || 'None'}
                        </div>
                        <div>
                            <span className="font-bold">Balance:</span> ${user.checkingBalance}
                        </div>
                    </div>

                    {/* Force Refetch */}
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                            setIsSyncing(true);
                            await syncNessieData(true); // Force
                            setIsSyncing(false);
                        }}
                        disabled={isSyncing}
                    >
                        Force Refetch (Bypass Cache)
                    </Button>

                    {/* Counts */}
                    <div className="grid grid-cols-4 gap-2 text-center bg-background p-2 rounded border">
                        <div>
                            <div className="font-bold text-lg">{userStore?.lastFetchSamples?.customers ? 1 : 0}</div>
                            <div className="text-[10px] uppercase text-muted-foreground">Cust</div>
                        </div>
                        <div>
                            <div className="font-bold text-lg">{userStore?.lastFetchSamples?.accounts ? 1 : 0}</div>
                            <div className="text-[10px] uppercase text-muted-foreground">Acct</div>
                        </div>
                        <div>
                            <div className="font-bold text-lg">{userStore.transactions.length}</div>
                            <div className="text-[10px] uppercase text-muted-foreground">Txs</div>
                        </div>
                        <div>
                            <div className="font-bold text-lg">{userStore.bills.length}</div>
                            <div className="text-[10px] uppercase text-muted-foreground">Bills</div>
                        </div>
                    </div>

                    {/* Raw Samples with Details/Summary since Accordion misses */}
                    <div className="space-y-2">
                        <details>
                            <summary className="cursor-pointer font-bold hover:underline">Raw Samples JSON</summary>
                            <pre className="mt-2 w-full overflow-x-auto p-2 bg-slate-950 text-slate-50 rounded text-[10px]">
                                {JSON.stringify(userStore?.lastFetchSamples, null, 2) || 'No samples'}
                            </pre>
                        </details>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
