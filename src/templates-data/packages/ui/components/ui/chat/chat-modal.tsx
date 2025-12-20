"use client";

import { useState, useEffect } from "react";
import { ChatThread, type ChatProvider } from "./chat-thread";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    IconMessage,
    IconX,
    IconMinus,
    IconMaximize,
    IconSparkles
} from "@tabler/icons-react";

export interface ChatModalProps {
    defaultOpen?: boolean;
    position?: "bottom-right" | "bottom-left";
    provider?: ChatProvider;
    model?: string;
    apiEndpoint?: string;
    className?: string;
}

export const ChatModal = ({
    defaultOpen = false,
    position = "bottom-right",
    provider = "openai",
    model,
    apiEndpoint = "/api/chat",
    className
}: ChatModalProps) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);

    // Handle escape key to close
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                setIsOpen(false);
            }
        };
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [isOpen]);

    const positionClasses = {
        "bottom-right": "right-6 bottom-6",
        "bottom-left": "left-6 bottom-6",
    };

    return (
        <>
            {/* Floating Action Button */}
            <Button
                onClick={() => {
                    setIsOpen(true);
                    setIsMinimized(false);
                }}
                className={cn(
                    "fixed z-50 h-14 w-14 rounded-full shadow-lg transition-all duration-300 hover:scale-110",
                    "bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70",
                    positionClasses[position],
                    isOpen && "scale-0 opacity-0",
                    className
                )}
                size="icon"
            >
                <div className="relative">
                    <IconMessage className="h-6 w-6" />
                    {/* Notification dot */}
                    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-green-500 border-2 border-white animate-pulse" />
                </div>
            </Button>

            {/* Chat Modal */}
            <div
                className={cn(
                    "fixed z-50 transition-all duration-300 ease-out",
                    positionClasses[position],
                    isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8 pointer-events-none",
                    isMaximized
                        ? "inset-4 sm:inset-8"
                        : isMinimized
                            ? "w-80"
                            : "w-[400px] h-[600px]"
                )}
            >
                {/* Backdrop for maximized view */}
                {isMaximized && (
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm -z-10"
                        onClick={() => setIsMaximized(false)}
                    />
                )}

                <div
                    className={cn(
                        "relative flex flex-col rounded-2xl border bg-background shadow-2xl overflow-hidden",
                        "ring-1 ring-black/5 dark:ring-white/5",
                        isMaximized ? "h-full" : isMinimized ? "h-auto" : "h-full"
                    )}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 px-4 py-3 bg-gradient-to-r from-primary/5 to-transparent border-b">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                                    <IconSparkles className="h-5 w-5 text-primary-foreground" />
                                </div>
                                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-sm">AI Assistant</h2>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                    Online • Powered by GPT-4
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-muted"
                                onClick={() => setIsMinimized(!isMinimized)}
                                title={isMinimized ? "Expand" : "Minimize"}
                            >
                                <IconMinus className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-muted"
                                onClick={() => setIsMaximized(!isMaximized)}
                                title={isMaximized ? "Restore" : "Maximize"}
                            >
                                <IconMaximize className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => setIsOpen(false)}
                                title="Close"
                            >
                                <IconX className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Chat Content */}
                    {!isMinimized && (
                        <div className="flex-1 overflow-hidden">
                            <ChatThread
                                provider={provider}
                                model={model}
                                apiEndpoint={apiEndpoint}
                            />
                        </div>
                    )}

                    {/* Minimized State */}
                    {isMinimized && (
                        <div className="p-4">
                            <p className="text-sm text-muted-foreground text-center">
                                Click to expand chat
                            </p>
                            <Button
                                className="w-full mt-2"
                                variant="outline"
                                onClick={() => setIsMinimized(false)}
                            >
                                Continue Chat
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
