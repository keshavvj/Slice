"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { chatWithSliceBot, ChatMessage } from "@/actions/gemini";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AnimatePresence, motion } from "framer-motion";

export function ChatBot() {
    const [isOpen, setIsOpen] = React.useState(false);
    const [messages, setMessages] = React.useState<ChatMessage[]>([
        { role: 'model', content: "Hi! I'm SliceBot. Ask me anything about the app!" }
    ]);
    const [input, setInput] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const scrollRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        // Call Gemini
        const response = await chatWithSliceBot(messages, userMsg);

        setMessages(prev => [...prev, { role: 'model', content: response.text }]);
        setLoading(false);
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="mb-4 pointer-events-auto origin-bottom-right"
                    >
                        <Card className="w-[350px] h-[500px] flex flex-col shadow-2xl border-primary/20">
                            <CardHeader className="p-4 bg-primary text-primary-foreground rounded-t-xl flex flex-row items-center justify-between space-y-0">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-purple-200 animate-pulse" />
                                    SliceBot
                                </CardTitle>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </CardHeader>
                            <CardContent className="flex-1 p-0 overflow-hidden">
                                <ScrollArea className="h-full p-4">
                                    <div className="flex flex-col gap-3">
                                        {messages.map((msg, idx) => (
                                            <div
                                                key={idx}
                                                className={cn(
                                                    "max-w-[80%] rounded-lg p-3 text-sm",
                                                    msg.role === 'user'
                                                        ? "bg-primary text-primary-foreground self-end rounded-br-none"
                                                        : "bg-muted text-foreground self-start rounded-bl-none"
                                                )}
                                            >
                                                {msg.content}
                                            </div>
                                        ))}
                                        {loading && (
                                            <div className="bg-muted self-start rounded-lg rounded-bl-none p-3 max-w-[80%]">
                                                <div className="flex gap-1">
                                                    <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                                    <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                                    <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" />
                                                </div>
                                            </div>
                                        )}
                                        <div ref={scrollRef} />
                                    </div>
                                </ScrollArea>
                            </CardContent>
                            <CardFooter className="p-3 border-t bg-muted/20">
                                <form onSubmit={handleSend} className="flex w-full gap-2">
                                    <Input
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Ask about Slice..."
                                        className="flex-1 h-9 text-sm"
                                    />
                                    <Button type="submit" size="icon" className="h-9 w-9" disabled={loading}>
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </form>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="pointer-events-auto"
            >
                <Button
                    size="icon"
                    className={cn(
                        "h-14 w-14 rounded-full shadow-lg transition-colors",
                        isOpen ? "bg-muted hover:bg-muted/90 text-foreground" : "bg-primary hover:bg-primary/90 text-primary-foreground"
                    )}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
                </Button>
            </motion.div>
        </div>
    );
}
