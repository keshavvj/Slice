'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Lightbulb } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function InsightsCard() {
    return (
        <Card className="col-span-2 md:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Insights</CardTitle>
                <Lightbulb className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                        <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium">Top Mover</p>
                        <p className="text-xs text-muted-foreground">
                            Your <span className="font-semibold text-foreground">Tech ETF</span> is up 2.4% today.
                        </p>
                    </div>
                </div>

                <div className="flex items-start gap-3 pt-2 border-t">
                    <Badge variant="outline" className="mt-0.5">Tip</Badge>
                    <p className="text-xs text-muted-foreground leading-snug">
                        You've spent <span className="font-semibold text-foreground">$145</span> on dining this week. decreasing this by 10% could save you $60/mo.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
