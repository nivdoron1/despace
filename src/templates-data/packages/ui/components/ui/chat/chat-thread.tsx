"use client";

import { ThreadPrimitive, ComposerPrimitive, MessagePrimitive } from "@assistant-ui/react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useChatRuntime, AssistantChatTransport } from "@assistant-ui/react-ai-sdk";
import { type FC, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    IconSend,
    IconRobot
} from "@tabler/icons-react";

export type ChatProvider = "openai" | "anthropic" | "gemini" | "groq";

export interface ChatThreadProps {
    threadId?: string;  // Now optional - auto-generated if not provided
    provider?: ChatProvider;
    model?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialMessages?: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onMessagesChange?: (messages: any[]) => void;
    apiEndpoint?: string;
    className?: string;
}

export const ChatThread: FC<ChatThreadProps> = ({
    // threadId: externalThreadId,
    provider = "openai",
    model,
    initialMessages = [],
    onMessagesChange,
    apiEndpoint = "/api/chat",
    className
}) => {


    const transport = useMemo(() => new AssistantChatTransport({
        api: apiEndpoint,
        body: { provider, model },
    }), [apiEndpoint, provider, model]);

    const runtime = useChatRuntime({
        transport,
        // @ts-expect-error - Assuming runtime supports initialMessages or we might need another way
        initialMessages,
    });

    // Sync messages back to parent for persistence
    useEffect(() => {
        // We try to subscribe to the runtime's message state if possible
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const unsafeRuntime = runtime as any;
        if (unsafeRuntime.subscribe) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return unsafeRuntime.subscribe((state: any) => {
                if (state.messages && onMessagesChange) {
                    onMessagesChange(state.messages);
                }
            });
        }
    }, [runtime, onMessagesChange]);

    return (
        <AssistantRuntimeProvider runtime={runtime}>
            <div className={cn("h-full flex flex-col bg-background", className)}>
                <ThreadPrimitive.Root className="flex h-full flex-col">
                    <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto scroll-smooth">
                        {/* Empty State */}
                        <ThreadPrimitive.Empty>
                            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
                                <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                                    <IconRobot className="h-8 w-8 text-primary/60" />
                                </div>
                                <p className="font-medium">Start a new conversation</p>
                            </div>
                        </ThreadPrimitive.Empty>

                        {/* Messages List */}
                        <div className="p-4 space-y-6 max-w-3xl mx-auto w-full">
                            <ThreadPrimitive.Messages
                                components={{
                                    UserMessage: CustomUserMessage,
                                    AssistantMessage: CustomAssistantMessage,
                                }}
                            />
                        </div>
                    </ThreadPrimitive.Viewport>

                    {/* Input Area */}
                    <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
                        <div className="max-w-3xl mx-auto w-full">
                            <CustomComposer />
                        </div>
                    </div>
                </ThreadPrimitive.Root>
            </div>
        </AssistantRuntimeProvider>
    );
};

// --- Custom Components ---

const CustomUserMessage: FC = () => (
    <MessagePrimitive.Root className="flex justify-end gap-3 group">
        <div className="flex flex-col items-end max-w-[80%]">
            <div className="bg-primary text-primary-foreground px-5 py-3 rounded-3xl rounded-tr-sm shadow-md">
                <MessagePrimitive.Content />
            </div>
        </div>
    </MessagePrimitive.Root>
);

const CustomAssistantMessage: FC = () => (
    <MessagePrimitive.Root className="flex justify-start gap-4 group w-full">
        <Avatar className="h-10 w-10 border shadow-sm mt-1">
            <AvatarFallback className="bg-muted">
                <IconRobot className="h-5 w-5 text-primary" />
            </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1 max-w-[85%]">
            <div className="bg-muted/50 px-5 py-3 rounded-3xl rounded-tl-sm border shadow-sm">
                <MessagePrimitive.Content />
            </div>
        </div>
    </MessagePrimitive.Root>
);

const CustomComposer: FC = () => (
    <ComposerPrimitive.Root className="relative flex items-end gap-2 bg-muted/30 p-2 rounded-3xl border focus-within:ring-2 focus-within:ring-ring/20 transition-all">
        {/* <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-muted-foreground">
            <IconPaperclip className="h-5 w-5" />
        </Button> */}

        <ComposerPrimitive.Input
            placeholder="Type a message..."
            className="flex-1 bg-transparent border-none focus:ring-0 min-h-[44px] py-3 px-2 resize-none max-h-[200px]"
            autoFocus
        />

        {/* <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-muted-foreground">
                <IconMicrophone className="h-5 w-5" />
            </Button> */}
        <ComposerPrimitive.Send asChild>
            <Button size="icon" className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 shadow transition-transform active:scale-95">
                <IconSend className="h-5 w-5" />
            </Button>
        </ComposerPrimitive.Send>
        {/* </div> */}
    </ComposerPrimitive.Root>
);
