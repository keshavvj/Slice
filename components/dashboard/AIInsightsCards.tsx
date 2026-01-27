"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore } from "@/lib/store";
import { generateAIInsights, AIInsight } from "@/actions/gemini";
import { TrendingUp, PieChart, Target, Lightbulb, Split, RefreshCw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function AIInsightsCards() {
    const store = useStore();
    const [insights, setInsights] = React.useState<AIInsight[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [isAi, setIsAi] = React.useState(false);

    const fetchInsights = React.useCallback(async () => {
        setLoading(true);
        // Extract relevant state to avoid sending huge objects
        const stateSnapshot = {
            user: store.user,
            portfolio: store.portfolio,
            splitRequests: store.splitRequests,
            goals: store.goals,
            transactions: store.transactions.slice(0, 50)
        };

        const data = await generateAIInsights(stateSnapshot);
        setInsights(data);
        setIsAi(data.some(i => i.isAiGenerated));
        setLoading(false);
    }, [store.user, store.portfolio, store.splitRequests, store.goals, store.transactions]);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            fetchInsights();
        }, 500); // Small delay to allow hydration
        return () => clearTimeout(timer);
    }, []); // Run once on mount

    if (loading && insights.length === 0) {
        return <SkeletonCards />;
    }

    const smartTip = insights.find(i => i.type === 'spending');
    const mainInsights = insights.filter(i => i.type !== 'spending').slice(0, 3);

    return (
        <Card className="shadow-sm border rounded-xl bg-white dark:bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 p-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    {isAi ? (
                        <Sparkles className="w-4 h-4 text-purple-500 fill-purple-100 animate-pulse" />
                    ) : (
                        <Lightbulb className="w-4 h-4 text-amber-500" />
                    )}
                    {isAi ? "Gemini Insights" : "Insights"}
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={fetchInsights} disabled={loading}>
                    <RefreshCw className={cn("w-3 h-3 text-muted-foreground", loading && "animate-spin")} />
                </Button>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="space-y-4">
                    {mainInsights.map((insight, idx) => (
                        <div key={idx} className="flex gap-3 items-start">
                            <div className={cn("mt-0.5 p-2 rounded-full shrink-0 h-fit",
                                insight.type === 'investing' && "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
                                insight.type === 'splits' && "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
                                insight.type === 'goals' && "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
                            )}>
                                {insight.type === 'investing' && <TrendingUp className="w-3 h-3" />}
                                {insight.type === 'splits' && <Split className="w-3 h-3" />}
                                {insight.type === 'goals' && <Target className="w-3 h-3" />}
                            </div>
                            <div>
                                <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5 leading-none">
                                    {insight.title}
                                </h4>
                                <p className="text-xs text-foreground leading-snug">
                                    {renderMessage(insight.message)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {smartTip && (
                    <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-lg flex gap-3 items-start">
                        <div className="mt-0.5 p-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 shrink-0 h-fit">
                            {isAi ? <Sparkles className="w-3 h-3" /> : <Lightbulb className="w-3 h-3" />}
                        </div>
                        <div>
                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-500 mb-0.5 leading-none">
                                {smartTip.title}
                            </h4>
                            <p className="text-xs text-foreground/90 leading-snug">
                                {renderMessage(smartTip.message)}
                            </p>
                        </div>
                    </div>
                )}
                {!isAi && !loading && (
                    <div className="mt-2 text-[10px] text-center text-muted-foreground italic">
                        Set GOOGLE_API_KEY for AI-powered insights
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function renderMessage(msg: string) {
    const parts = msg.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="font-bold">{part.replace(/\*\*/g, '')}</strong>;
        }
        return part;
    });
}

function SkeletonCards() {
    return (
        <Card className="col-span-1 shadow-sm border rounded-xl h-[340px]">
            <CardHeader className="flex flex-row justify-between pb-2">
                <div className="h-5 w-24 bg-muted rounded animate-pulse" />
                <div className="h-5 w-5 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-4 animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
                        <div className="space-y-2 w-full">
                            <div className="h-3 w-16 bg-muted rounded" />
                            <div className="h-3 w-full bg-muted rounded" />
                        </div>
                    </div>
                ))}
                <div className="h-20 bg-muted rounded-lg animate-pulse mt-4" />
            </CardContent>
        </Card>
    );
}
