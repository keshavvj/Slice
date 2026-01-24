'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useStore } from '@/lib/store';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function GoalsPage() {
    const { goal, user, friends } = useStore();

    const percent = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);

    const handleContribute = () => {
        // Logic to add contribution would go here
        // For MVP just alert or mock update would require store action 'contributeToGoal'
        alert("Contributed $50 to " + goal.name);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Shared Goals</h1>

            <Card className="max-w-3xl">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-xl">{goal.name}</CardTitle>
                            <CardDescription>Target: ${goal.targetAmount}</CardDescription>
                        </div>
                        <Button onClick={handleContribute}>Contribute $50</Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="font-semibold">${goal.currentAmount} saved</span>
                            <span className="text-muted-foreground">{percent.toFixed(0)}%</span>
                        </div>
                        <Progress value={percent} className="h-4" />
                    </div>

                    <div>
                        <h3 className="text-sm font-medium mb-3">Members</h3>
                        <div className="flex -space-x-2">
                            <Avatar className="border-2 border-background">
                                <AvatarFallback className="bg-primary text-primary-foreground">{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            {goal.members.map(m => (
                                <Avatar key={m.id} className="border-2 border-background">
                                    <AvatarFallback>{m.avatarInitials}</AvatarFallback>
                                </Avatar>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-sm font-medium mb-3">Recent Contributions</h3>
                        <div className="space-y-2">
                            {goal.contributions.map((c, i) => {
                                const memberName = c.memberId === user.id ? "You" : friends.find(f => f.id === c.memberId)?.name || "Unknown";
                                return (
                                    <div key={i} className="flex justify-between text-sm border-b pb-2">
                                        <span>{memberName} contributed</span>
                                        <span className="font-semibold">${c.amount}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
