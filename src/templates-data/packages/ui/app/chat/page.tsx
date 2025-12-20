"use client";

import { useState, useEffect, useCallback } from "react";
import { ChatThread } from "@/components/ui/chat/chat-thread";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    IconPlus,
    IconMessage,
    IconTrash,
    IconSettings,
    IconLayoutSidebar,
    IconLayoutSidebarLeftCollapse
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Message = any; // Using any to match the chat-thread weak typing

interface Thread {
    id: string;
    title: string;
    messages: Message[];
    createdAt: number;
}

const STORAGE_KEY = "chat_threads_v1";

export default function ChatPage() {
    const [threads, setThreads] = useState<Thread[]>([]);
    const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isLoaded, setIsLoaded] = useState(false);

    const createNewThread = useCallback(() => {
        const newThread: Thread = {
            id: crypto.randomUUID(),
            title: "New Chat",
            messages: [],
            createdAt: Date.now(),
        };
        setThreads(prev => [newThread, ...prev]);
        setActiveThreadId(newThread.id);
    }, []);

    const deleteThread = useCallback((e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setThreads(prev => {
            const next = prev.filter(t => t.id !== id);
            if (activeThreadId === id) {
                setActiveThreadId(next.length > 0 ? next[0].id : null);
            }
            return next;
        });
    }, [activeThreadId]);

    // Load from local storage
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setThreads(parsed);
                if (parsed.length > 0) {
                    setActiveThreadId(parsed[0].id);
                }
            } catch (e) {
                console.error("Failed to parse chat history", e);
            }
        } else {
            // Create initial thread
            createNewThread();
        }
        setIsLoaded(true);
    }, [createNewThread]);

    const handleMessagesChange = useCallback((messages: Message[]) => {
        if (!activeThreadId) return;

        setThreads(prev => prev.map(t => {
            if (t.id === activeThreadId) {
                // Generate a title if it's "New Chat" and we have messages
                let newTitle = t.title;
                if (t.title === "New Chat" && messages.length > 0) {
                    // Naive title generation from first message
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const firstUserMsg = messages.find((m: any) => m.role === 'user');
                    if (firstUserMsg && firstUserMsg.content) {
                        newTitle = typeof firstUserMsg.content === 'string'
                            ? firstUserMsg.content.slice(0, 30)
                            : "Conversation";
                    }
                }
                return { ...t, messages, title: newTitle };
            }
            return t;
        }));
    }, [activeThreadId]);

    const activeThread = threads.find(t => t.id === activeThreadId);

    if (!isLoaded) return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Desktop Sidebar */}
            {sidebarOpen && (
                <div className="hidden md:block w-[280px] shrink-0 transition-all duration-300">
                    <SidebarContent
                        threads={threads}
                        activeThreadId={activeThreadId}
                        setActiveThreadId={setActiveThreadId}
                        createNewThread={createNewThread}
                        deleteThread={deleteThread}
                    />
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 relative">
                {/* Header */}
                <header className="h-14 border-b flex items-center px-4 justify-between bg-background/50 backdrop-blur top-0 z-10">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                        >
                            {sidebarOpen ? <IconLayoutSidebarLeftCollapse className="h-5 w-5" /> : <IconLayoutSidebar className="h-5 w-5" />}
                        </Button>

                        {/* Mobile Sidebar Trigger */}
                        <div className="md:hidden">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="-ml-2">
                                        <IconLayoutSidebar className="h-5 w-5" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="p-0 w-[280px]">
                                    <SidebarContent
                                        threads={threads}
                                        activeThreadId={activeThreadId}
                                        setActiveThreadId={setActiveThreadId}
                                        createNewThread={createNewThread}
                                        deleteThread={deleteThread}
                                    />
                                </SheetContent>
                            </Sheet>
                        </div>

                        <div className="flex items-center gap-2 ml-2">
                            <span className="font-semibold text-sm">{activeThread?.title || "Chat"}</span>
                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal">GPT-4</Badge>
                        </div>
                    </div>
                </header>

                {/* Chat Area */}
                <div className="flex-1 overflow-hidden relative">
                    {activeThread ? (
                        <ChatThread
                            key={activeThread.id} // Key ensures remount on thread switch = correct persistence reset
                            threadId={activeThread.id}
                            initialMessages={activeThread.messages}
                            onMessagesChange={handleMessagesChange}
                            className="bg-transparent"
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <p>No chat selected.</p>
                            <Button onClick={createNewThread} variant="outline" className="mt-4">
                                Start a new chat
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

interface SidebarContentProps {
    threads: Thread[];
    activeThreadId: string | null;
    setActiveThreadId: (id: string) => void;
    createNewThread: () => void;
    deleteThread: (e: React.MouseEvent, id: string) => void;
}

function SidebarContent({
    threads,
    activeThreadId,
    setActiveThreadId,
    createNewThread,
    deleteThread
}: SidebarContentProps) {
    return (
        <div className="flex flex-col h-full bg-muted/20 border-r">
            <div className="p-4 border-b flex items-center justify-between">
                <Button
                    onClick={createNewThread}
                    className="w-full justify-start gap-2 shadow-sm"
                    variant="default"
                >
                    <IconPlus className="h-4 w-4" />
                    New Chat
                </Button>
            </div>

            <ScrollArea className="flex-1 px-2 py-4">
                <div className="space-y-1">
                    {threads.length === 0 && (
                        <p className="text-center text-sm text-muted-foreground py-8">No chats yet</p>
                    )}
                    {threads.map(thread => (
                        <div
                            key={thread.id}
                            onClick={() => setActiveThreadId(thread.id)}
                            className={cn(
                                "group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all cursor-pointer relative",
                                activeThreadId === thread.id
                                    ? "bg-accent/50 text-accent-foreground font-medium shadow-sm"
                                    : "text-muted-foreground hover:bg-muted"
                            )}
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                <IconMessage className={cn(
                                    "h-4 w-4 shrink-0",
                                    activeThreadId === thread.id ? "text-primary" : "text-muted-foreground/70"
                                )} />
                                <span className="truncate">{thread.title}</span>
                            </div>

                            {/* Delete Button (visible on hover or active) */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className={cn(
                                    "h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2",
                                    activeThreadId === thread.id && "opacity-100" // Always show on active for ease
                                )}
                                onClick={(e) => deleteThread(e, thread.id)}
                            >
                                <IconTrash className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                            </Button>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            <div className="p-4 border-t mt-auto">
                <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted transition-colors cursor-pointer">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs">
                        UI
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">User Account</p>
                        <p className="text-xs text-muted-foreground truncate">user@example.com</p>
                    </div>
                    <IconSettings className="h-4 w-4 text-muted-foreground" />
                </div>
            </div>
        </div>
    );
}
