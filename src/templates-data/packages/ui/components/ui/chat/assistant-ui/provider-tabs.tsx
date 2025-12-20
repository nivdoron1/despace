"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type ChatProvider = "openai" | "anthropic" | "gemini" | "groq";

export interface ProviderConfig {
    id: ChatProvider;
    name: string;
    icon?: React.ReactNode;
    enabled?: boolean;
}

export const defaultProviders: ProviderConfig[] = [
    { id: "openai", name: "ChatGPT", enabled: true },
    { id: "anthropic", name: "Claude", enabled: true },
    { id: "gemini", name: "Gemini", enabled: true },
    { id: "groq", name: "Groq", enabled: true },
];

interface ProviderTabsProps {
    providers?: ProviderConfig[];
    activeProvider: ChatProvider;
    onProviderChange: (provider: ChatProvider) => void;
    className?: string;
}

export function ProviderTabs({
    providers = defaultProviders,
    activeProvider,
    onProviderChange,
    className,
}: ProviderTabsProps) {
    const enabledProviders = providers.filter((p) => p.enabled !== false);

    return (
        <div
            className={cn(
                "aui-provider-tabs flex items-center gap-1 border-b",
                className
            )}
        >
            {enabledProviders.map((provider) => (
                <Button
                    key={provider.id}
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "aui-provider-tab relative rounded-none border-b-2 border-transparent px-4 py-2 font-medium transition-colors hover:bg-transparent hover:text-foreground",
                        activeProvider === provider.id
                            ? "border-b-primary text-foreground"
                            : "text-muted-foreground"
                    )}
                    onClick={() => onProviderChange(provider.id)}
                >
                    {provider.icon && (
                        <span className="mr-2">{provider.icon}</span>
                    )}
                    {provider.name}
                </Button>
            ))}
        </div>
    );
}
