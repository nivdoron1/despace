import { ollama } from "ollama-ai-provider-v2";
import { convertToModelMessages, streamText } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages } = await req.json();
    const result = streamText({
        model: ollama("llama3"),
        messages: convertToModelMessages(messages),
    });
    return result.toUIMessageStreamResponse();
}
