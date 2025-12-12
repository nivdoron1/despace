import { bedrock } from "@ai-sdk/amazon-bedrock";
import { convertToModelMessages, streamText } from "ai";

export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages } = await req.json();
    const result = streamText({
        model: bedrock("anthropic.claude-3-5-sonnet-20240620-v1:0"),
        messages: convertToModelMessages(messages),
    });
    return result.toUIMessageStreamResponse();
}
