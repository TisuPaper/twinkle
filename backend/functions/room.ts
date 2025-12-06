export const room = {
    name: "room",
    description: "Generates a room for the user.",
    parameters: {
        type: "object",
        properties: {}, // Empty for now as requested
        required: [],
    },
    handler: async ({ }: {}) => {
        // Placeholder logic
        console.log("Generating room...");
        return {
            message: "Room generation functionality is not yet implemented.",
        };
    },
};
