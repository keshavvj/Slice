'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Plus, Search, Trash2, Check, X, Link as LinkIcon, Copy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useUser } from '@auth0/nextjs-auth0/client';

export default function FriendsPage() {
    const { user } = useUser();

    // Data State
    const [friends, setFriends] = React.useState<any[]>([]);
    const [requests, setRequests] = React.useState<{ incoming: any[], outgoing: any[] }>({ incoming: [], outgoing: [] });
    const [isLoading, setIsLoading] = React.useState(true);

    // Add Friend / Search State
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const [searchHandle, setSearchHandle] = React.useState("");
    const [searchResults, setSearchResults] = React.useState<any[]>([]);
    const [isSearching, setIsSearching] = React.useState(false);

    // Invite State
    const [inviteLink, setInviteLink] = React.useState<string | null>(null);

    // Fetch Initial Data
    const fetchData = React.useCallback(async () => {
        setIsLoading(true);
        try {
            const [friendsRes, requestsRes] = await Promise.all([
                fetch('/api/friends').then(res => res.json()),
                fetch('/api/friends/requests').then(res => res.json())
            ]);

            if (friendsRes.friends) setFriends(friendsRes.friends);
            if (requestsRes.incoming) setRequests(requestsRes); // API returns { incoming, outgoing }
        } catch (error) {
            console.error("Failed to fetch friends data", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Lookup Users
    React.useEffect(() => {
        if (searchHandle.length < 3) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await fetch(`/api/users/lookup?handle=${encodeURIComponent(searchHandle)}`);
                const data = await res.json();
                if (data.users) setSearchResults(data.users);
            } catch (err) {
                console.error(err);
            } finally {
                setIsSearching(false);
            }
        }, 500); // Debounce

        return () => clearTimeout(timer);
    }, [searchHandle]);

    // Actions
    const sendRequest = async (toUserId: string) => {
        try {
            const res = await fetch('/api/friends/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ toUserId })
            });
            const data = await res.json();
            if (res.ok) {
                if (data.status === 'already_friends') {
                    alert('You are already friends!');
                } else {
                    alert('Request sent!');
                    setIsDialogOpen(false);
                    fetchData(); // Refresh outgoing list
                }
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (err) {
            alert('Failed to send request');
        }
    };

    const respondToRequest = async (cuid: string, action: 'accept' | 'decline') => {
        try {
            const res = await fetch(`/api/friends/requests/${cuid}/${action}`, { method: 'POST' });
            if (res.ok) {
                fetchData(); // Refresh friends list and requests
            } else {
                alert('Action failed');
            }
        } catch (err) {
            alert('Action failed');
        }
    };

    const createInvite = async () => {
        try {
            const res = await fetch('/api/friends/invite/create', { method: 'POST' });
            const data = await res.json();
            if (res.ok && data.url) {
                setInviteLink(data.url);
            }
        } catch (err) {
            alert('Failed to create invite');
        }
    };

    const copyInvite = () => {
        if (inviteLink) {
            navigator.clipboard.writeText(inviteLink);
            alert('Link copied to clipboard!');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight">Friends</h1>
                    <p className="text-muted-foreground">Manage your connections and invites.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="lg" className="rounded-full shadow-lg">
                            <Plus className="mr-2 h-4 w-4" /> Add Friend
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add a Friend</DialogTitle>
                            <DialogDescription>
                                Search by their unique handle (e.g. @username)
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search handle..."
                                    className="pl-9"
                                    value={searchHandle}
                                    onChange={(e) => setSearchHandle(e.target.value)}
                                />
                            </div>

                            {isSearching && <p className="text-sm text-center text-muted-foreground">Searching...</p>}

                            <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                {searchResults.map((user) => (
                                    <div key={user.id} className="flex items-center justify-between p-2 rounded-lg border hover:bg-muted/50">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback>{user.displayName?.[0] || user.handle[0].toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className="overflow-hidden">
                                                <p className="text-sm font-medium leading-none truncate">{user.displayName || `@${user.handle}`}</p>
                                                <p className="text-xs text-muted-foreground truncate">@{user.handle}</p>
                                            </div>
                                        </div>
                                        <Button size="sm" variant="secondary" onClick={() => sendRequest(user.id)}>Add</Button>
                                    </div>
                                ))}
                                {searchHandle.length >= 3 && searchResults.length === 0 && !isSearching && (
                                    <p className="text-sm text-center text-muted-foreground">No users found.</p>
                                )}
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="text-sm font-medium mb-2">Or share an invite link</h4>
                                {inviteLink ? (
                                    <div className="flex gap-2">
                                        <Input readOnly value={inviteLink} className="text-xs font-mono" />
                                        <Button size="icon" variant="outline" onClick={copyInvite}>
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <Button variant="outline" className="w-full" onClick={createInvite}>
                                        <LinkIcon className="mr-2 h-4 w-4" /> Generate Link
                                    </Button>
                                )}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <Tabs defaultValue="friends" className="w-full">
                <TabsList>
                    <TabsTrigger value="friends">Friends ({friends.length})</TabsTrigger>
                    <TabsTrigger value="requests">
                        Requests
                        {requests.incoming.length > 0 && (
                            <Badge variant="destructive" className="ml-2 h-5 min-w-[20px] px-1 rounded-full">
                                {requests.incoming.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="friends" className="mt-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {friends.map(friend => (
                            <Card key={friend.id} className="hover:border-primary/50 transition-all cursor-pointer">
                                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                    <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                                        <AvatarFallback className="bg-gradient-to-br from-indigo-400 to-purple-400 text-white font-bold">
                                            {friend.displayName?.[0] || friend.handle[0].toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="overflow-hidden">
                                        <CardTitle className="text-lg truncate">{friend.displayName || `@${friend.handle}`}</CardTitle>
                                        <p className="text-sm text-muted-foreground">@{friend.handle}</p>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-xs text-muted-foreground">
                                        Friends since {new Date(friend.since).toLocaleDateString()}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {friends.length === 0 && !isLoading && (
                            <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                                <p>No friends yet. Add some people!</p>
                            </div>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="requests" className="mt-6 space-y-8">
                    {/* Incoming */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Incoming Requests</h3>
                        {requests.incoming.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {requests.incoming.map(req => (
                                    <Card key={req.id}>
                                        <CardContent className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarFallback>{req.user.handle[0].toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium">{req.user.displayName || `@${req.user.handle}`}</p>
                                                    <p className="text-xs text-muted-foreground">@{req.user.handle}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => respondToRequest(req.id, 'decline')}>
                                                    <X className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" className="text-green-500 hover:text-green-600 hover:bg-green-50" onClick={() => respondToRequest(req.id, 'accept')}>
                                                    <Check className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : <p className="text-sm text-muted-foreground">No pending requests.</p>}
                    </div>

                    {/* Outgoing */}
                    <div className="space-y-4 pt-4 border-t">
                        <h3 className="text-lg font-semibold text-muted-foreground">Sent Requests</h3>
                        {requests.outgoing.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {requests.outgoing.map(req => (
                                    <div key={req.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8 opacity-70">
                                                <AvatarFallback>{req.user.handle[0].toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm font-medium">@{req.user.handle}</p>
                                                <p className="text-xs text-muted-foreground">Sent {new Date(req.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline">Pending</Badge>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-sm text-muted-foreground">No sent requests.</p>}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
