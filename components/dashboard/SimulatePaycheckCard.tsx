import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Zap, DollarSign, ArrowRight, Wallet, TrendingUp, CheckCircle2, Edit2 } from "lucide-react"
import { useStore } from "@/lib/store"
import { Separator } from "@/components/ui/separator"

export function SimulatePaycheckCard() {
    const { user, simulatePaycheck } = useStore()
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [customAmount, setCustomAmount] = useState<string>("")

    // Initialize custom amount from user setting on mount
    useEffect(() => {
        if (user.paycheckAmount) {
            setCustomAmount(user.paycheckAmount.toString())
        }
    }, [user.paycheckAmount])

    const currentAmount = parseFloat(customAmount) || 0

    // Logic copies store logic for visual preview
    let investAmount = 0
    let strategy = "Manual"

    if (user.investFixedOverride && user.investFixedOverride > 0) {
        investAmount = user.investFixedOverride
        strategy = `Fixed ($${investAmount})`
    } else if (user.investPercent > 0) {
        investAmount = (currentAmount * user.investPercent) / 100
        strategy = `${user.investPercent}% of Paycheck`
    }

    const netDeposit = currentAmount - investAmount

    const handleSimulate = async () => {
        setLoading(true)
        setSuccess(false)

        // Pass the custom amount to the store action
        await simulatePaycheck(currentAmount)

        setLoading(false)
        setSuccess(true)

        setTimeout(() => setSuccess(false), 3000)
    }

    return (
        <Card className="hover:shadow-md transition-shadow border-0 shadow-none">
            <CardHeader className="pb-3 px-6 pt-6">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Zap className="h-4 w-4 text-amber-500" />
                        Simulate Paycheck
                    </CardTitle>
                    {success && <div className="text-xs font-bold text-green-600 flex items-center gap-1 animate-in fade-in"><CheckCircle2 className="h-3 w-3" /> Processed</div>}
                </div>
                <CardDescription className="text-xs">
                    Test your auto-invest workflows with custom amounts
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-6 pb-6">
                <div className="bg-muted/40 p-4 rounded-xl space-y-4 border border-border/50">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <DollarSign className="h-3 w-3" /> Income Amount
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-sm font-semibold text-muted-foreground">$</span>
                            <Input
                                type="number"
                                value={customAmount}
                                onChange={(e) => setCustomAmount(e.target.value)}
                                className="pl-6 font-semibold bg-background border-muted-foreground/20"
                            />
                        </div>
                    </div>

                    <Separator className="bg-border/60" />

                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground flex items-center gap-2">
                            <TrendingUp className="h-3 w-3" /> Auto-Invest
                        </span>
                        <span className="font-semibold text-blue-600">-${investAmount.toLocaleString()}</span>
                    </div>

                    <div className="text-[10px] text-muted-foreground text-right -mt-3">
                        {strategy}
                    </div>

                    <Separator className="bg-border/60" />

                    <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground flex items-center gap-2">
                            <Wallet className="h-3 w-3" /> Net to Checking
                        </span>
                        <span className="font-bold">+${netDeposit.toLocaleString()}</span>
                    </div>
                </div>

                <Button
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-sm"
                    onClick={handleSimulate}
                    disabled={loading || currentAmount <= 0}
                >
                    {loading ? "Processing..." : `Process $${currentAmount.toLocaleString()} Deposit`}
                    {!loading && <ArrowRight className="h-4 w-4 ml-2" />}
                </Button>
            </CardContent>
        </Card>
    )
}
