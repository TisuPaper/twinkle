export const learnWord = {
    name: "learnWord",
    description: "Helps the user learn a new word.",
    parameters: {
        type: "object",
        properties: {
            word: {
                type: "string",
                description: "The word to learn",
            },
        },
        required: ["word"],
    },
    handler: async ({ word }: { word: string }) => {
        // Placeholder logic
        console.log(`Learning word: ${word}`);
        return {
            message: `Here is the definition and usage of ${word}...`,
        };
    },
};
