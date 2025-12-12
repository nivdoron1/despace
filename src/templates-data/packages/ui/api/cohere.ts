import { cohere } from "@ai-sdk/cohere";
import { convertToModelMessages, streamText } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages } = await req.json();
    const result = streamText({
        model: cohere("command-r-plus"),
        messages: convertToModelMessages(messages),
    });
    return result.toUIMessageStreamResponse();
}
