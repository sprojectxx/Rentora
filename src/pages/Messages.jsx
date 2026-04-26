import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { messageService } from "@/api/messageService";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, ChevronLeft } from "lucide-react";
import RoleGate from "@/components/shared/RoleGate";
import EmptyState from "@/components/shared/EmptyState";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function MessagesInner() {
    const { user, navigateToLogin } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeThread, setActiveThread] = useState(null);
    const [draft, setDraft] = useState("");
    const [showChatOnMobile, setShowChatOnMobile] = useState(false);

    const { data: messages = [] } = useQuery({
        queryKey: ["messages", user?.id],
        queryFn: () => messageService.getUserMessages(user?.id),
        enabled: !!user
    });

    const threads = useMemo(() => {
        const map = new Map();
        for (const m of messages) {
            const otherParty = m.sender_id === user?.id ? m.receiver_id : m.sender_id;
            const tId = `${m.property_id}_${otherParty}`;
            const existing = map.get(tId);
            if (!existing || new Date(m.created_at) > new Date(existing.last.created_at)) {
                map.set(tId, { 
                    id: tId, 
                    last: m, 
                    property_title: m.properties?.title || "Property", 
                    property_id: m.property_id,
                    otherParty
                });
            }
        }
        return Array.from(map.values()).sort((a, b) => new Date(b.last.created_at) - new Date(a.last.created_at));
    }, [messages, user]);

    useEffect(() => {
        if (!activeThread && threads.length) setActiveThread(threads[0].id);
    }, [threads, activeThread]);

    useEffect(() => {
        if (!user) return;
        const channel = messageService.subscribeToMessages(user.id, () => {
            queryClient.invalidateQueries({ queryKey: ["messages", user.id] });
        });

        return () => {
            messageService.unsubscribeFromMessages(channel);
        };
    }, [user, queryClient]);

    const activeMessages = messages.filter((m) => {
        const otherParty = m.sender_id === user?.id ? m.receiver_id : m.sender_id;
        const tId = `${m.property_id}_${otherParty}`;
        return tId === activeThread;
    });
    const activeThreadMeta = threads.find((t) => t.id === activeThread);

    const send = async () => {
        if (!draft.trim() || !activeThreadMeta || !user) return;
        const last = activeThreadMeta.last;
        const receiver = activeThreadMeta.otherParty;

        try {
            await messageService.sendMessage(last.property_id, user.id, receiver, draft.trim());
            setDraft("");
            queryClient.invalidateQueries({ queryKey: ["messages", user.id] });
        } catch (error) {
            toast.error("Failed to send message. Please try again.");
            console.error("Message send error:", error);
        }
    };

    if (threads.length === 0) {
        return (
            <div className="max-w-5xl mx-auto px-5 py-10">
                <h1 className="font-display text-4xl font-medium tracking-tight mb-6">Messages</h1>
                <EmptyState
                    icon={MessageCircle}
                    title="No conversations yet"
                    description="Reach out to owners from property pages to start a chat."
                    action={{ label: "Browse stays", onClick: () => navigate("/browse") }}
                />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-5 lg:px-8 py-8">
            <h1 className="font-display text-4xl font-medium tracking-tight mb-6">Messages</h1>
            <div className="flex md:grid md:grid-cols-[320px_1fr] border border-border rounded-3xl overflow-hidden bg-card h-[75vh]">
                <aside className={cn(
                    "border-r border-border overflow-y-auto w-full md:w-auto",
                    showChatOnMobile ? "hidden md:block" : "block"
                )}>
                    {threads.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => {
                                setActiveThread(t.id);
                                setShowChatOnMobile(true);
                            }}
                            className={cn(
                                "w-full text-left p-4 border-b border-border hover:bg-secondary/40 transition-colors",
                                activeThread === t.id && "bg-secondary/60"
                            )}
                        >
                            <div className="font-medium truncate text-sm">{t.property_title}</div>
                            <div className="text-xs text-muted-foreground truncate mt-0.5">{t.last.message}</div>
                        </button>
                    ))}
                </aside>

                <div className={cn(
                    "flex-col w-full md:w-auto",
                    showChatOnMobile ? "flex" : "hidden md:flex"
                )}>
                    {activeThreadMeta && (
                        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="md:hidden -ml-2 rounded-full w-8 h-8 shrink-0"
                                    onClick={() => setShowChatOnMobile(false)}
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </Button>
                                <div>
                                    <div className="font-medium text-sm">{activeThreadMeta.property_title}</div>
                                    <div className="text-xs text-muted-foreground">
                                        with {activeThreadMeta.otherParty}
                                    </div>
                                </div>
                            </div>
                            {activeThreadMeta.property_id && (
                                <Button variant="ghost" size="sm" asChild className="rounded-full">
                                    <Link to={`/property/${activeThreadMeta.property_id}`}>View listing</Link>
                                </Button>
                            )}
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto p-5 space-y-3">
                        {activeMessages.map((m) => {
                            const mine = m.sender_id === user?.id;
                            return (
                                <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                                    <div
                                        className={cn(
                                            "max-w-[75%] px-4 py-2.5 rounded-2xl text-sm",
                                            mine ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-secondary rounded-bl-sm"
                                        )}
                                    >
                                        {m.message}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="border-t border-border p-3 flex gap-2">
                        <Input
                            placeholder="Type a message..."
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && send()}
                            className="rounded-full"
                        />
                        <Button onClick={send} className="rounded-full gap-1">
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Messages() {
    return (
        <RoleGate>
            <MessagesInner />
        </RoleGate>
    );
}