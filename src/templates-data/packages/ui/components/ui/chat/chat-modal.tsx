"use client";

import { useState } from "react";
import { ChatThread } from "./chat-thread";
import { Button } from "@/components/ui/button";
import { MessageCircle, X } from "lucide-react";

export const ChatModal = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Floating button */}
            <Button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg"
                size="icon"
            >
                <MessageCircle className="h-6 w-6" />
            </Button>

            {/* Modal overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end justify-end p-6">
                    <div
                        className="fixed inset-0 bg-black/50"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="relative z-50 h-[600px] w-[400px] rounded-lg border bg-background shadow-xl flex flex-col">
                        <div className="flex items-center justify-between border-b p-4">
                            <h2 className="text-lg font-semibold">Chat Assistant</h2>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsOpen(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <ChatThread />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
