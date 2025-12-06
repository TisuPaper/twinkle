import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// Initialize Anthropic client
// Note: Ensure ANTHROPIC_API_KEY is set in your .env file
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || "",
});

// Define the expected response schema for validation
interface LearningContent {
    words: string[];
    topic: string;
    difficulty: "easy" | "medium" | "hard";
}

function validateResponse(data: any): LearningContent {
    if (!data || typeof data !== 'object') {
        throw new Error("Invalid response format: Not an object");
    }

    if (!Array.isArray(data.words) || data.words.some((w: any) => typeof w !== 'string')) {
        throw new Error("Invalid response format: 'words' must be an array of strings");
    }

    if (typeof data.topic !== 'string') {
        throw new Error("Invalid response format: 'topic' must be a string");
    }

    if (!['easy', 'medium', 'hard'].includes(data.difficulty)) {
        throw new Error("Invalid response format: 'difficulty' must be 'easy', 'medium', or 'hard'");
    }

    return data as LearningContent;
}

export async function POST(req: Request) {
    try {
        const { prompt } = await req.json();

        if (!prompt) {
            return NextResponse.json(
                { error: "Prompt is required" },
                { status: 400 }
            );
        }

        if (!process.env.ANTHROPIC_API_KEY) {
            console.error("ANTHROPIC_API_KEY is missing");
            return NextResponse.json(
                { error: "Server configuration error: API key missing" },
                { status: 500 }
            );
        }

        const systemPrompt = `
You are the Learning Content Selector AI for a children's multisensory learning system.
Your job is to turn a parent's request into a clean JSON object that follows this schema:

{
  "words": ["word1", "word2", "..."],
  "topic": "short topic name",
  "difficulty": "easy | medium | hard"
}

Rules:
- 3–8 simple, age-appropriate words unless parent requests more.
- Words must be concrete and easy for early learners (e.g., nouns like "cat", "ball" or simple verbs like "run", "jump").
- Do NOT add any explanations.
- Do NOT output anything except valid JSON.
- No trailing text.
`;

        const msg = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1024,
            temperature: 0.2,
            system: systemPrompt,
            messages: [
                {
                    role: "user",
                    content: `Parent Request: ${prompt}`,
                },
            ],
        });

        // Extract text content from the response
        const textContent = msg.content[0].type === 'text' ? msg.content[0].text : '';

        if (!textContent) {
            throw new Error("Empty response from AI");
        }

        // Parse JSON
        let parsedData;
        try {
            parsedData = JSON.parse(textContent);
        } catch (e) {
            console.error("Failed to parse AI response as JSON:", textContent);
            throw new Error("AI response was not valid JSON");
        }

        // Validate structure
        const validatedData = validateResponse(parsedData);

        return NextResponse.json(validatedData);

    } catch (e: any) {
        console.error("AI Processing Error:", e);
        return NextResponse.json(
            { error: e.message || "Failed to generate learning content" },
            { status: 500 }
        );
    }
}
