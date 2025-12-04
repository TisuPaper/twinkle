export const learnMath = {
    name: "learnMath",
    description: "Helps the user learn a math concept.",
    parameters: {
        type: "object",
        properties: {
            topic: {
                type: "string",
                description: "The math topic to learn",
            },
        },
        required: ["topic"],
    },
    handler: async ({ topic }: { topic: string }) => {
        // Placeholder logic
        console.log(`Learning math topic: ${topic}`);
        return {
            message: `Here is an explanation of ${topic}...`,
        };
    },
};
