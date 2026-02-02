'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useStore } from '@/lib/store';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { NewGoalDialog } from '@/components/NewGoalDialog';
import { ContributeDialog } from '@/components/ContributeDialog';
import { GoalDetailsDialog } from '@/components/GoalDetailsDialog';
import { getMemberBreakdown } from '@/lib/goals';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, Trophy, Target, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GoalsPage() {
    const { goals, user, checkRecurringGoals, fetchGoals } = useStore();

    React.useEffect(() => {
        fetchGoals();
        checkRecurringGoals();
    }, [checkRecurringGoals, fetchGoals]);

    const totalSaved = goals.reduce((acc, g) => acc + g.currentAmount, 0);
    const totalTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0);

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight mb-2">Shared Goals</h1>
                    <p className="text-muted-foreground text-lg">Collaborate, save, and hit your targets together.</p>
                </div>
                <NewGoalDialog />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content - Goals List */}
                <div className="lg:col-span-2 space-y-6">
                    {goals.length === 0 && (
                        <div className="text-center py-20 border-2 border-dashed rounded-3xl bg-white/5">
                            <h3 className="text-xl font-medium mb-2">No goals yet</h3>
                            <p className="text-muted-foreground mb-6">Start a savings goal with your squad.</p>
                            <NewGoalDialog />
                        </div>
                    )}
                    {goals.map((goal, idx) => {
                        const percent = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
                        const breakdown = getMemberBreakdown(goal, user.id);
                        const topContributors = breakdown.slice(0, 3);

                        return (
                            <motion.div
                                key={goal.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                            >
                                <GoalDetailsDialog goalId={goal.id}>
                                    <Card className="overflow-hidden border-white/10 bg-white/5 hover:bg-white/10 transition-colors backdrop-blur-md cursor-pointer group">
                                        <CardHeader className="pb-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <CardTitle className="text-2xl group-hover:text-primary transition-colors">{goal.name}</CardTitle>
                                                        {goal.recurring?.enabled && (
                                                            <Badge variant="secondary" className="text-[10px] h-5">
                                                                Auto-Save On
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <CardDescription className="text-base">
                                                        Target: <span className="text-foreground font-medium">${goal.targetAmount.toLocaleString()}</span>
                                                    </CardDescription>
                                                </div>
                                                {/* Details button removed, entire card is trigger */}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm font-medium">
                                                    <span>${goal.currentAmount.toLocaleString()} saved</span>
                                                    <span>{percent.toFixed(0)}%</span>
                                                </div>
                                                <Progress value={percent} className="h-3 bg-white/10" indicatorClassName="bg-gradient-to-r from-indigo-500 to-purple-500" />
                                            </div>

                                            <div className="flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center pt-2">
                                                {/* Top Contributors Mini-List */}
                                                <div className="flex items-center gap-4">
                                                    <div className="flex -space-x-3">
                                                        {topContributors.map((c) => (
                                                            <Avatar key={c.memberId} className="border-2 border-background w-8 h-8 ring-2 ring-background">
                                                                <AvatarFallback className="text-[10px] bg-muted text-foreground">
                                                                    {c.avatarInitials}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                        ))}
                                                        {breakdown.length > 3 && (
                                                            <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-medium text-muted-foreground ring-2 ring-background">
                                                                +{breakdown.length - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        <span className="font-medium text-foreground">{breakdown[0]?.name || 'No one'}</span> lead{breakdown[0] ? 's' : ''} with {breakdown[0]?.percent || 0}%
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 w-full sm:w-auto" onClick={(e) => e.stopPropagation()}>
                                                    <ContributeDialog goalId={goal.id} goalName={goal.name} />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </GoalDetailsDialog>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Right Sidebar - Stats */}
                <div className="space-y-6">
                    <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Trophy className="h-5 w-5 text-yellow-500" /> Total Impact
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold mb-1">${totalSaved.toLocaleString()}</div>
                            <p className="text-sm text-muted-foreground">saved across all shared goals</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <TrendingUp className="h-5 w-5 text-green-500" /> Quick Stats
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center pb-2 border-b">
                                <span className="text-sm text-muted-foreground">Active Goals</span>
                                <span className="font-medium">{goals.length}</span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b">
                                <span className="text-sm text-muted-foreground">Total Target</span>
                                <span className="font-medium">${totalTarget.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Completion</span>
                                <span className="font-medium text-green-500">
                                    {totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(1) : 0}%
                                </span>
                            </div>
                        </CardContent>
                    </Card>


                </div>
            </div>
        </div>
    );
}
