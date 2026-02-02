'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Check, X } from 'lucide-react';

export default function InvitePage({ params }: { params: Promise<{ code: string }> }) {
    const router = useRouter();
    const resolvedParams = React.use(params);
    const { code } = resolvedParams;
    const [inviteData, setInviteData] = React.useState<any>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [isClaiming, setIsClaiming] = React.useState(false);

    React.useEffect(() => {
        fetch(`/api/friends/invite/${code}`)
            .then(res => res.json())
            .then(data => {
                if (data.valid) {
                    setInviteData(data);
                } else {
                    setError("This invite link is invalid or has expired.");
                }
            })
            .catch(() => setError("Failed to load invite."))
            .finally(() => setIsLoading(false));
    }, [code]);

    const handleClaim = async () => {
        setIsClaiming(true);
        try {
            const res = await fetch(`/api/friends/invite/${code}/claim`, { method: 'POST' });
            const data = await res.json();

            if (res.ok) {
                if (data.status === 'already_friends') {
                    alert("You are already friends!");
                } else {
                    alert("Friend added!");
                }
                router.push('/friends');
            } else {
                alert(data.error || "Failed to accept invite");
            }
        } catch (err) {
            alert("An error occurred");
        } finally {
            setIsClaiming(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="animate-pulse">Loading invite...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Card className="max-w-md w-full mx-4 border-destructive/50 bg-destructive/5">
                    <CardHeader className="text-center">
                        <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4 text-destructive">
                            <X className="w-6 h-6" />
                        </div>
                        <CardTitle className="text-destructive">Invalid Invite</CardTitle>
                        <CardDescription>{error}</CardDescription>
                    </CardHeader>
                    <CardFooter className="justify-center gap-2">
                        <Button variant="outline" onClick={() => router.push('/dashboard')}>Go Home</Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    const { user } = inviteData;

    return (
        <div className="flex h-[80vh] items-center justify-center">
            <Card className="max-w-md w-full mx-4 shadow-xl border-primary/20">
                <CardHeader className="text-center pb-8 pt-8">
                    <Avatar className="h-20 w-20 mx-auto mb-4 border-4 border-background shadow-lg">
                        <AvatarFallback className="text-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white">
                            {user.displayName?.[0] || user.handle[0].toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-2xl">
                        {user.displayName || `@${user.handle}`}
                    </CardTitle>
                    <CardDescription className="text-base mt-2">
                        invited you to connect on Slice
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-center pb-8">
                    <div className="bg-muted/50 p-4 rounded-xl text-sm text-muted-foreground">
                        Connect to split bills, track expenses, and see what your friends are up to.
                    </div>
                </CardContent>
                <CardFooter className="flex-col gap-3 pb-8">
                    <Button size="lg" className="w-full rounded-full text-base" onClick={handleClaim} disabled={isClaiming}>
                        {isClaiming ? "Accepting..." : "Accept Invite"}
                    </Button>
                    <Button variant="ghost" onClick={() => router.push('/dashboard')}>
                        No thanks
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
