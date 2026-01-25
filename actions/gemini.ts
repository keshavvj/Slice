"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { AppState } from "@/types";

// Initialize Gemini inside action to allow hot-reloading keys

export type InsightType = "investing" | "splits" | "goals" | "spending";

export interface AIInsight {
    type: InsightType;
    title: string;
    message: string;
    metric?: string;
    action?: string;
}

export async function generateAIInsights(state: Partial<AppState>) {
    // Debug logging
    console.log("[Gemini] Check API Key:", process.env.GOOGLE_API_KEY ? "Present" : "Missing");

    if (!process.env.GOOGLE_API_KEY) {
        console.log("[Gemini] No API Key found, using fallback");
        return getFallbackInsights(state);
    }

    try {
        console.log("[Gemini] Attempting generation...");
        // Initialize inside function to ensure fresh Env var usage
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
      You are an AI financial assistant for a dashboard app called Slice. 
      Analyze the following user data and generate 4 specific insights in strictly valid JSON format.
      
      User Data:
      - Name: ${state.user?.name}
      - Balance: ${state.user?.checkingBalance}
      - Portfolio Balance: ${state.portfolio?.balance} (Weekly change: ${state.portfolio?.weeklyChangePercent}%)
      - Split Requests (Owed by user): ${JSON.stringify(state.splitRequests?.filter(r => r.friendId === state.user?.id && r.status === 'pending').length)}
      - Split Requests (Owed to user): ${JSON.stringify(state.splitRequests?.filter(r => r.requesterId === state.user?.id && r.status === 'pending').length)}
      - Active Goals: ${JSON.stringify(state.goals?.map(g => ({ name: g.name, current: g.currentAmount, target: g.targetAmount })))}
      - Recent Transactions: ${JSON.stringify(state.transactions?.slice(0, 5))}

      Requirements:
      Generate an array of 4 objects with keys: "type", "title", "message".
      1. Type "investing": Top Mover/Status. E.g. "Growth Portfolio up 2.4%".
      2. Type "splits": Summary of what is owed. E.g. "You're owed $86".
      3. Type "goals": Progress on one goal. E.g. "Emergency Fund 72% complete".
      4. Type "spending": Smart behavioral tip based on transactions or balance. E.g. "Spent $145 on dining".

      Keep tone professional, friendly, concise. No emojis in the message text.
      
      Output strictly JSON:
      [
        { "type": "investing", "title": "...", "message": "..." },
        { "type": "splits", "title": "...", "message": "..." },
        { "type": "goals", "title": "...", "message": "..." },
        { "type": "spending", "title": "...", "message": "..." }
      ]
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log("[Gemini] Raw response:", text.substring(0, 100) + "...");

        // Cleanup markdown if present
        const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const insights = JSON.parse(jsonStr);
        return insights as AIInsight[];

    } catch (error) {
        console.error("Gemini Insight Error:", error);
        return getFallbackInsights(state);
    }
}

function getFallbackInsights(state: Partial<AppState>): AIInsight[] {
    // Fallback heuristic generation if AI fails or no key
    const insights: AIInsight[] = [];

    // 1. Investing
    const change = state.portfolio?.weeklyChangePercent || 0;
    insights.push({
        type: "investing",
        title: change >= 0 ? "Portfolio Growing" : "Market Dip",
        message: `Your portfolio is ${change >= 0 ? "up" : "down"} ${Math.abs(change)}% this week.`
    });

    // 2. Splits
    const owedToMe = state.splitRequests
        ?.filter(r => r.requesterId === state.user?.id && r.status === 'pending')
        .reduce((sum, r) => sum + r.amountOwed, 0) || 0;

    insights.push({
        type: "splits",
        title: "Split Requests",
        message: owedToMe > 0
            ? `You are owed $${owedToMe.toFixed(0)} across active splits.`
            : "You are all settled up with friends."
    });

    // 3. Goals
    const goal = state.goals?.[0];
    if (goal) {
        const percent = Math.round((goal.currentAmount / goal.targetAmount) * 100);
        insights.push({
            type: "goals",
            title: "Goal Progress",
            message: `${goal.name} is ${percent}% complete.`
        });
    } else {
        insights.push({
            type: "goals",
            title: "Set a Goal",
            message: "Create a savings goal to track your progress."
        });
    }

    // 4. Spending - Randomize Fallback Tip
    const tips = [
        "Check your recurring subscriptions to save money.",
        "Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings.",
        "Cooking at home 2 more times a week could save $150/mo.",
        "Set up auto-transfer to your savings account on payday.",
        "Review your transaction history for duplicate charges.",
        "Using a credit card with rewards can earn you 1-2% back."
    ];
    const randomTip = tips[Math.floor(Math.random() * tips.length)];

    insights.push({
        type: "spending",
        title: "Smart Tip",
        message: randomTip
    });

    return insights;
}
