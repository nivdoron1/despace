"use client";

import { ThreadPrimitive, MessagePrimitive, ComposerPrimitive } from "@assistant-ui/react";
import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useChatRuntime, AssistantChatTransport } from "@assistant-ui/react-ai-sdk";
import type { FC } from "react";

const ChatThread: FC = () => {
    const runtime = useChatRuntime({
        transport: new AssistantChatTransport({
            api: "/api/chat",
        }),
    });

    return (
        <AssistantRuntimeProvider runtime={runtime}>
            <div className="h-full">
                <ThreadPrimitive.Root className="flex h-full flex-col">
                    <ThreadPrimitive.Viewport className="flex-1 overflow-y-auto">
                        <ThreadPrimitive.Messages
                            components={{
                                UserMessage: UserMessage,
                                AssistantMessage: AssistantMessage,
                            }}
                        />
                    </ThreadPrimitive.Viewport>
                    <ChatInput />
                </ThreadPrimitive.Root>
            </div>
        </AssistantRuntimeProvider>
    );
};

const UserMessage: FC = () => (
    <MessagePrimitive.Root className="flex justify-end mb-4">
        <div className="bg-primary text-primary-foreground rounded-lg px-4 py-2 max-w-[80%]">
            <MessagePrimitive.Content />
        </div>
    </MessagePrimitive.Root>
);

const AssistantMessage: FC = () => (
    <MessagePrimitive.Root className="flex justify-start mb-4">
        <div className="bg-muted rounded-lg px-4 py-2 max-w-[80%]">
            <MessagePrimitive.Content />
        </div>
    </MessagePrimitive.Root>
);

const ChatInput: FC = () => (
    <ComposerPrimitive.Root className="border-t p-4">
        <div className="flex gap-2">
            <ComposerPrimitive.Input
                placeholder="Type a message..."
                className="flex-1 rounded-lg border bg-background px-4 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <ComposerPrimitive.Send className="bg-primary text-primary-foreground rounded-lg px-4 py-2 hover:bg-primary/90">
                Send
            </ComposerPrimitive.Send>
        </div>
    </ComposerPrimitive.Root>
);

export { ChatThread };
