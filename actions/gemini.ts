"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { AppState } from "@/types";

export type InsightType = "investing" | "splits" | "goals" | "spending";

export interface AIInsight {
    type: InsightType;
    title: string;
    message: string;
    action?: string;
    isAiGenerated?: boolean;
}

export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
}

export async function generateAIInsights(state: Partial<AppState>): Promise<AIInsight[]> {
    const apiKey = process.env.GOOGLE_API_KEY;

    // Basic validation to warn in logs
    if (!apiKey) {
        console.warn("[Gemini] No API Key found in environment variables.");
        return getFallbackInsights(state);
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        // Prepare a concise but rich context
        const context = {
            user: {
                name: state.user?.name || "User",
                balance: state.user?.checkingBalance,
                investDest: state.user?.investDestination,
                stocks: state.user?.selectedStocks?.join(", ")
            },
            portfolio: {
                balance: state.portfolio?.balance,
                change: state.portfolio?.weeklyChangePercent
            },
            splits: {
                owedToUser: state.splitRequests?.filter(r => r.requesterId === state.user?.id && r.status === 'pending').length,
                userOwes: state.splitRequests?.filter(r => r.friendId === state.user?.id && r.status === 'pending').length,
            },
            goals: state.goals?.map(g => ({ name: g.name, current: g.currentAmount, target: g.targetAmount })),
            recentTransactions: state.transactions?.slice(0, 8).map(t => `${t.merchant_name} ($${t.amount})`)
        };

        const prompt = `
            Act as an intelligent financial sidekick for the "Slice" app. 
            Analyze the user's financial snapshot below and generate 4 specific, actionable insights.

            User Context: ${JSON.stringify(context)}

            Requirements:
            1. Return strictly a JSON array of 4 objects.
            2. Schema: { "type": "investing"|"splits"|"goals"|"spending", "title": "Short Title", "message": "Concise, friendly advice." }
            3. Tone: Professional but conversational (Gen Z friendly).
            4. Logic:
               - "investing": Comment on portfolio performance or suggest investing more if balance is high.
               - "splits": Remind them to collect owed money or pay friends.
               - "goals": Encourage progress on specific goals.
               - "spending": Spot patterns in recent transactions (e.g., "Too much coffee?").
            
            Strictly valid JSON output only. No markdown formatting.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Cleanup markdown if present (Gemini sometimes adds \`\`\`json ...)
        const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const insights = JSON.parse(jsonStr);

        // Append the flag
        return insights.map((i: any) => ({ ...i, isAiGenerated: true }));

    } catch (error: any) {
        console.error("[Gemini] Generation failed details:", error.message || error);
        if (error.response) {
            try {
                const errorBody = await error.response.text();
                // console.error("[Gemini] Error response body:", errorBody);
            } catch (e) {
                // ignore
            }
        }
        return getFallbackInsights(state);
    }
}

function getFallbackInsights(state: Partial<AppState>): AIInsight[] {
    const insights: AIInsight[] = [];

    // 1. Investing
    const change = state.portfolio?.weeklyChangePercent || 0;
    insights.push({
        type: "investing",
        title: change >= 0 ? "Portfolio Green" : "Market Dip",
        message: `Your portfolio is ${change >= 0 ? "up" : "down"} ${Math.abs(change)}% this week. Keep it up!`,
        isAiGenerated: false
    });

    // 2. Splits
    const owedToMe = state.splitRequests
        ?.filter(r => r.requesterId === state.user?.id && r.status === 'pending')
        .reduce((sum, r) => sum + r.amountOwed, 0) || 0;

    insights.push({
        type: "splits",
        title: "Pending Splits",
        message: owedToMe > 0
            ? `Friends owe you $${owedToMe.toFixed(0)}. Send a reminder?`
            : "You are all settled up with friends.",
        isAiGenerated: false
    });

    // 3. Goals
    const goal = state.goals?.[0];
    if (goal && goal.targetAmount > 0) {
        const percent = Math.round((goal.currentAmount / goal.targetAmount) * 100);
        insights.push({
            type: "goals",
            title: goal.name,
            message: `You're ${percent}% of the way there!`,
            isAiGenerated: false
        });
    } else {
        insights.push({
            type: "goals",
            title: "Create a Goal",
            message: "Start saving for something special today.",
            isAiGenerated: false
        });
    }

    // 4. Spending
    insights.push({
        type: "spending",
        title: "Daily Tip",
        message: "Try the 50/30/20 rule to optimize your savings this month.",
        isAiGenerated: false
    });

    return insights;
}

export async function chatWithSliceBot(history: ChatMessage[], newMessage: string) {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) return { text: "I'm having trouble connecting to my brain right now. Please check the API key." };

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        // 1. Convert to Gemini History format
        const historyForApi = history.map(h => ({
            role: h.role === 'model' ? 'model' : 'user',
            parts: [{ text: h.content }],
        }));

        // 2. Remove leading model messages (Gemini requirement: strict user-start alternation)
        while (historyForApi.length > 0 && historyForApi[0].role === 'model') {
            historyForApi.shift();
        }

        const systemPrompt = `
            You are SliceBot, the helpful AI assistant for the Slice financial app.
            Your goal is to help users navigate the app, understand features, and manage their finances.
            
            App Features:
            - **Dashboard**: View balance, portfolio, and insights.
            - **Splits**: Split bills with friends. specific friends owed.
            - **Friends**: Add friends to send money or split bills.
            - **Investing**: Auto-invest rounds ups or percentage of paychecks.
            - **Goals**: Shared savings goals with friends.
            
            Keep answers short (under 50 words unless asked for detail), friendly, and helpful.
            If asked about personal financial advice, disclaim that you are an AI.
        `;

        // 3. Start Chat with Prompt Injection
        let chat;
        let finalMessage = newMessage;

        if (historyForApi.length > 0) {
            // Existing conversation: Inject system prompt into the first historical message
            // so the model retains context of who it is.
            const firstMsg = historyForApi[0];
            if (firstMsg.parts && firstMsg.parts[0]) {
                firstMsg.parts[0].text = `${systemPrompt}\n\n---\n\n${firstMsg.parts[0].text}`;
            }

            chat = model.startChat({
                history: historyForApi,
                generationConfig: { maxOutputTokens: 300 },
            });
        } else {
            // New conversation: Inject system prompt into the current message
            chat = model.startChat({
                history: [],
                generationConfig: { maxOutputTokens: 300 },
            });
            finalMessage = `${systemPrompt}\n\nUser Question: ${newMessage}`;
        }

        const result = await chat.sendMessage(finalMessage);
        const response = await result.response;
        return { text: response.text() };

    } catch (error: any) {
        console.error("Chat Error Details:", error.message || error);
        if (error.response) {
            try {
                const errorBody = await error.response.text();
                console.error("Chat Error Response Body:", errorBody);
            } catch (e) {
                // ignore
            }
        }
        return { text: "Sorry, I couldn't process that. Try again later." };
    }
}
