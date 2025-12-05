import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";
import { functions, functionMap } from "./functions";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

app.post("/api/chat", async (req, res) => {
    try {
        const { messages } = req.body;

        if (!messages) {
            res.status(400).json({ error: "Messages are required" });
            return;
        }

        // Standard chat completion with tools
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful and enthusiastic AI assistant. You have access to a 'room' tool that can generate rooms. If the user asks to create, generate, or make a room, use the 'room' tool."
                },
                ...messages
            ] as ChatCompletionMessageParam[],
            tools: functions.map((fn): ChatCompletionTool => ({
                type: "function",
                function: {
                    name: fn.name,
                    description: fn.description,
                    parameters: fn.parameters as any,
                },
            })),
            tool_choice: "auto",
        });

        const responseMessage = completion.choices[0].message;

        // Check if the model wanted to call a function
        if (responseMessage.tool_calls) {
            const toolCalls = responseMessage.tool_calls;
            // Extend conversation with assistant's reply
            const newMessages = [...messages, responseMessage];

            for (const toolCall of toolCalls) {
                const functionName = (toolCall as any).function.name;
                const functionArgs = JSON.parse((toolCall as any).function.arguments);

                const toolFunction = functionMap[functionName as keyof typeof functionMap];

                if (toolFunction) {
                    const functionResult = await toolFunction.handler(functionArgs);

                    newMessages.push({
                        tool_call_id: toolCall.id,
                        role: "tool",
                        name: functionName,
                        content: JSON.stringify(functionResult),
                    } as ChatCompletionMessageParam);
                }
            }

            // Get a new response from the model where it can see the function result
            const secondResponse = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: newMessages as ChatCompletionMessageParam[],
            });

            res.json(secondResponse.choices[0].message);
        } else {
            res.json(responseMessage);
        }

    } catch (error) {
        console.error("Error in chat endpoint:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
