'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SharedGoal } from '@/types';
import { useStore } from '@/lib/store';
import { getMemberBreakdown, computeNextRunDate } from '@/lib/goals';
import { format, parseISO } from 'date-fns';
import { Settings, Activity, Users, RefreshCw, Play } from 'lucide-react';

interface GoalDetailsDialogProps {
    goalId: string;
    children?: React.ReactNode;
}

export function GoalDetailsDialog({ goalId, children }: GoalDetailsDialogProps) {
    const { goals, user, friends, updateGoalRecurring, contributeToGoal } = useStore();
    const goal = goals.find(g => g.id === goalId);

    const [recurringEnabled, setRecurringEnabled] = React.useState(false);
    const [frequency, setFrequency] = React.useState<"weekly" | "biweekly" | "monthly">("weekly");
    const [amount, setAmount] = React.useState("50");
    const [scope, setScope] = React.useState<"me" | "everyone">("me");

    // Sync state with goal when opened
    React.useEffect(() => {
        if (goal?.recurring) {
            setRecurringEnabled(goal.recurring.enabled);
            setFrequency(goal.recurring.frequency);
            setAmount(String(goal.recurring.amount));
            setScope(goal.recurring.scope);
        }
    }, [goal]);

    if (!goal) return null;

    const percent = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
    const breakdown = getMemberBreakdown(goal, user.id);

    const handleRecurringSave = () => {
        const numAmount = Number(amount);
        if (numAmount <= 0) return;

        const now = new Date();
        const nextRun = computeNextRunDate(frequency, now);

        updateGoalRecurring(goal.id, {
            enabled: recurringEnabled,
            frequency,
            amount: numAmount,
            scope,
            startDateISO: now.toISOString(),
            nextRunDateISO: nextRun.toISOString() // First run is next cycle, or should be today? Let's say next cycle for "setup"
        });
    };

    const handleRunRecurringNow = () => {
        // Force run logic - we can just use the store logic or manually trigger a contribution
        // Actually, store has checkRecurringGoals which runs based on date. 
        // To force run, we might need to cheat the date or just manually contribute.
        // Let's manually contribute proper amounts for demo purposes.
        const numAmount = Number(amount);
        if (scope === 'me') {
            contributeToGoal(goal.id, numAmount, user.id); // TODO: Add type='recurring' if possible or let checkRecurring handle it. 
            // Since contributeToGoal only does manual type currently, we might want to update it later. 
            // For now, let's just use manual contribution but mark it.
        } else {
            // Everyone
            const memberIds = [user.id, ...goal.members.map(m => m.id)];
            memberIds.forEach(id => contributeToGoal(goal.id, numAmount, id));
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                {children || <Button variant="ghost" size="sm">Details</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col p-0 overflow-hidden">
                <div className="p-6 pb-2">
                    <DialogHeader>
                        <DialogTitle className="text-2xl flex items-center gap-2">
                            {goal.name}
                            <Badge variant="outline" className="ml-2 font-normal text-xs">
                                {percent.toFixed(0)}% Done
                            </Badge>
                        </DialogTitle>
                        <DialogDescription>Target: ${goal.targetAmount.toLocaleString()}</DialogDescription>
                    </DialogHeader>
                </div>

                <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-6 border-b">
                        <TabsList className="bg-transparent p-0 h-auto gap-6">
                            <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 px-0">Overview</TabsTrigger>
                            <TabsTrigger value="breakdown" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 px-0">Breakdown</TabsTrigger>
                            <TabsTrigger value="activity" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 px-0">Activity</TabsTrigger>
                        </TabsList>
                    </div>

                    <ScrollArea className="flex-1 p-6">
                        <TabsContent value="overview" className="space-y-6 m-0 h-full">
                            <Card className="bg-primary/5 border-primary/10">
                                <CardContent className="pt-6">
                                    <div className="flex justify-between items-end mb-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Total Saved</p>
                                            <p className="text-4xl font-bold text-primary">${goal.currentAmount.toLocaleString()}</p>
                                        </div>
                                        <div className="text-sm text-muted-foreground text-right">
                                            ${(goal.targetAmount - goal.currentAmount).toLocaleString()} to go
                                        </div>
                                    </div>
                                    <Progress value={percent} className="h-3" />
                                </CardContent>
                            </Card>

                            <div className="space-y-4">
                                <h3 className="text-sm font-medium flex items-center gap-2">
                                    <RefreshCw className="h-4 w-4" /> Recurring Contributions
                                </h3>
                                <div className="border rounded-xl p-4 space-y-4 bg-muted/20">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="recurring-mode" className="font-medium">Enable Auto-Save</Label>
                                        <Switch
                                            id="recurring-mode"
                                            checked={recurringEnabled}
                                            onCheckedChange={(c) => {
                                                setRecurringEnabled(c);
                                                // Auto-save logic triggers on "Run Now" or leaving dialog ideally, 
                                                // but for UX let's just set state and verify with a button.
                                            }}
                                        />
                                    </div>

                                    {recurringEnabled && (
                                        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                            <div className="space-y-2">
                                                <Label text-xs>Frequency</Label>
                                                <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="weekly">Weekly</SelectItem>
                                                        <SelectItem value="biweekly">Bi-weekly</SelectItem>
                                                        <SelectItem value="monthly">Monthly</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label text-xs>Amount ($)</Label>
                                                <Input
                                                    type="number"
                                                    value={amount}
                                                    onChange={e => setAmount(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2 col-span-2">
                                                <Label text-xs>Who pays?</Label>
                                                <Select value={scope} onValueChange={(v: any) => setScope(v)}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="me">Just Me</SelectItem>
                                                        <SelectItem value="everyone">Everyone (Split equally)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="col-span-2 pt-2 flex gap-2">
                                                <Button onClick={handleRecurringSave} className="flex-1">Save Settings</Button>
                                                <Button variant="outline" onClick={handleRunRecurringNow}>
                                                    <Play className="h-3 w-3 mr-2" /> Run Now
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="breakdown" className="m-0 h-full">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Member</TableHead>
                                        <TableHead className="text-right">Contrib. ($)</TableHead>
                                        <TableHead className="text-right">Share (%)</TableHead>
                                        <TableHead className="w-[100px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {breakdown.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                                No contributions yet. Be the first!
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {breakdown.map((item) => (
                                        <TableRow key={item.memberId}>
                                            <TableCell className="font-medium flex items-center gap-2">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarFallback className="text-[10px]">{item.avatarInitials}</AvatarFallback>
                                                </Avatar>
                                                {item.name} {item.isCurrentUser && <Badge variant="secondary" className="text-[10px] py-0 h-4">You</Badge>}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">${item.amount}</TableCell>
                                            <TableCell className="text-right">{item.percent}%</TableCell>
                                            <TableCell>
                                                <Progress value={item.percent} className="h-2 w-16" />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TabsContent>

                        <TabsContent value="activity" className="m-0 h-full">
                            <div className="space-y-4">
                                {goal.contributions.length === 0 && <p className="text-center text-muted-foreground py-10">No activity recorded.</p>}
                                {goal.contributions.map((c, i) => {
                                    // Resolve name again since contributions are raw data
                                    const member = goal.members.find(m => m.id === c.memberId) || (c.memberId === user.id ? { name: 'You' } : null);
                                    const name = member ? member.name : 'Unknown';

                                    return (
                                        <div key={i} className="flex justify-between items-center bg-card p-3 rounded-lg border">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full ${c.type === 'recurring' ? 'bg-purple-500/10 text-purple-500' : 'bg-green-500/10 text-green-500'}`}>
                                                    {c.type === 'recurring' ? <RefreshCw className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">{name} {c.type === 'recurring' && 'Auto-saved'}</p>
                                                    <p className="text-xs text-muted-foreground">{format(parseISO(c.date), 'MMM d, h:mm a')}</p>
                                                </div>
                                            </div>
                                            <span className="font-mono font-medium">+${c.amount}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </TabsContent>
                    </ScrollArea>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
