"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";


import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { ChatProvider } from "./provider-tabs";

export interface ModelConfig {
    name: string;
    value: string;
}

export const providerModels: Record<ChatProvider, ModelConfig[]> = {
    openai: [
        { name: "GPT 4o", value: "gpt-4o" },
        { name: "GPT 4o Mini", value: "gpt-4o-mini" },
        { name: "o1 Mini", value: "o1-mini" },
        { name: "o1", value: "o1" },
    ],
    anthropic: [
        { name: "Claude 3.5 Sonnet", value: "claude-3-5-sonnet-20240620" },
        { name: "Claude 3 Opus", value: "claude-3-opus-20240229" },
        { name: "Claude 3 Haiku", value: "claude-3-haiku-20240307" },
    ],
    gemini: [
        { name: "Gemini 2.0 Flash", value: "gemini-2.0-flash" },
        { name: "Gemini 1.5 Pro", value: "gemini-1.5-pro" },
        { name: "Gemini 1.5 Flash", value: "gemini-1.5-flash" },
    ],
    groq: [
        { name: "Llama 3.3 70B", value: "llama-3.3-70b-versatile" },
        { name: "Llama 3.1 8B", value: "llama-3.1-8b-instant" },
        { name: "Mixtral 8x7B", value: "mixtral-8x7b-32768" },
    ],
};

export const defaultModels: Record<ChatProvider, string> = {
    openai: "gpt-4o-mini",
    anthropic: "claude-3-5-sonnet-20240620",
    gemini: "gemini-2.0-flash",
    groq: "llama-3.3-70b-versatile",
};

interface ModelSelectorProps {
    provider: ChatProvider;
    model: string;
    onModelChange: (model: string) => void;
}

export function ModelSelector({ provider, model, onModelChange }: ModelSelectorProps) {
    const models = providerModels[provider] || [];
    const selectedModel = models.find((m) => m.value === model) || models[0];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="w-fit gap-2 px-2 font-semibold"
                >
                    {selectedModel?.name || "Select Model"}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[220px]">
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                    {provider.charAt(0).toUpperCase() + provider.slice(1)} Models
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {models.map((m) => (
                    <DropdownMenuItem
                        key={m.value}
                        onSelect={() => onModelChange(m.value)}
                        className="justify-between"
                    >
                        {m.name}
                        {model === m.value && <Check className="h-4 w-4 opacity-100" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
