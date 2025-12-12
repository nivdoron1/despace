import { azure } from "@ai-sdk/azure";
import { convertToModelMessages, streamText } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages } = await req.json();
    const result = streamText({
        model: azure("your-deployment-name"),
        messages: convertToModelMessages(messages),
    });
    return result.toUIMessageStreamResponse();
}
