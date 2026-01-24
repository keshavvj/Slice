'use client';

import * as React from 'react';
import { useStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SettingsPage() {
    const { user, updateUserParams } = useStore();

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>

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
                        <Button variant="destructive" onClick={() => { localStorage.clear(); window.location.reload(); }}>
                            Reset All Data
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
