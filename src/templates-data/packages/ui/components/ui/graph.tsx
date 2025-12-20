"use client"

import * as React from "react"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts"

interface GraphProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any[]
    lines: { key: string; color: string; name: string }[]
    height?: number
    className?: string
}

export function Graph({ data, lines, height = 300, className }: GraphProps) {
    return (
        <div style={{ width: '100%', height }} className={className}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart
                    data={data}
                    margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--popover-foreground))' }}
                    />
                    {lines.map((line) => (
                        <Line
                            key={line.key}
                            type="monotone"
                            dataKey={line.key}
                            stroke={line.color}
                            name={line.name}
                            activeDot={{ r: 8 }}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}
