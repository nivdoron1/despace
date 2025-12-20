"use client"

import * as React from "react"
import { X } from "lucide-react"
import { Command as CommandPrimitive } from "cmdk"
import { cn } from "@/lib/utils"

import { Badge } from "@/components/ui/badge"
import {
    Command,
    CommandGroup,
    CommandItem,
    CommandList,
} from "@/components/ui/command"

type Option = {
    label: string
    value: string
}

interface MultiSelectProps {
    options: Option[]
    selected: string[]
    onChange: (selected: string[]) => void
    placeholder?: string
    className?: string
}

export function MultiSelect({
    options,
    selected,
    onChange,
    placeholder = "Select...",
    className,
}: MultiSelectProps) {
    const inputRef = React.useRef<HTMLInputElement>(null)
    const [open, setOpen] = React.useState(false)
    const [inputValue, setInputValue] = React.useState("")

    const handleUnselect = (framework: string) => {
        onChange(selected.filter((s) => s !== framework))
    }

    const handleKeyDown = React.useCallback(
        (e: React.KeyboardEvent<HTMLDivElement>) => {
            const input = inputRef.current
            if (input) {
                if (e.key === "Delete" || e.key === "Backspace") {
                    if (input.value === "" && selected.length > 0) {
                        onChange(selected.slice(0, -1))
                    }
                }
                // This is not a default behaviour of the <input /> field
                if (e.key === "Escape") {
                    input.blur()
                }
            }
        },
        [selected, onChange]
    )

    const selectables = options.filter((option) => !selected.includes(option.value))

    return (
        <Command
            onKeyDown={handleKeyDown}
            className={cn("overflow-visible bg-transparent", className)}
        >
            <div
                className="group border border-input px-3 py-2 text-sm ring-offset-background rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
            >
                <div className="flex gap-1 flex-wrap">
                    {selected.map((framework) => {
                        const option = options.find((o) => o.value === framework)
                        return (
                            <Badge key={framework} variant="secondary">
                                {option ? option.label : framework}
                                <button
                                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            handleUnselect(framework)
                                        }
                                    }}
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                    }}
                                    onClick={() => handleUnselect(framework)}
                                >
                                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                </button>
                            </Badge>
                        )
                    })}
                    {/* Avoid having the "Search" Input be too small. */}
                    <CommandPrimitive.Input
                        ref={inputRef}
                        value={inputValue}
                        onValueChange={setInputValue}
                        onBlur={() => setOpen(false)}
                        onFocus={() => setOpen(true)}
                        placeholder={placeholder}
                        className="ml-2 bg-transparent outline-none placeholder:text-muted-foreground flex-1"
                    />
                </div>
            </div>
            <div className="relative mt-2">
                {open && selectables.length > 0 ? (
                    <div className="absolute w-full z-10 top-0 rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
                        <CommandList>
                            <CommandGroup className="h-full overflow-auto">
                                {selectables.map((framework) => {
                                    return (
                                        <CommandItem
                                            key={framework.value}
                                            onSelect={() => {
                                                setInputValue("")
                                                onChange([...selected, framework.value])
                                            }}
                                            className="cursor-pointer"
                                        >
                                            {framework.label}
                                        </CommandItem>
                                    )
                                })}
                            </CommandGroup>
                        </CommandList>
                    </div>
                ) : null}
            </div>
        </Command>
    )
}
