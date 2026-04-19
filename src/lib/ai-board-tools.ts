import { SchemaType, type FunctionDeclarationsTool } from "@google/generative-ai";

/**
 * Tool declarations for the board agent — names/shapes aligned with
 * `executeAiToolCallsClient` (PR 20–21).
 */
export const boardAgentTools: FunctionDeclarationsTool = {
  functionDeclarations: [
    {
      name: "createStickyNote",
      description:
        "Create a sticky note (category: creation, templates). Use for SWOT cells, retro column headers, single notes, or grids. Optional x/y place the top-left; omit to get a default position. Optional fill is a hex color (e.g. #fef08a) for color-coded columns.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          text: {
            type: SchemaType.STRING,
            description: "Body text for the sticky note",
          },
          x: { type: SchemaType.NUMBER, description: "World x (optional)" },
          y: { type: SchemaType.NUMBER, description: "World y (optional)" },
          fill: {
            type: SchemaType.STRING,
            description:
              "Optional CSS hex fill, e.g. #fef08a (yellow), #fecaca, #bbf7d0",
          },
        },
        required: ["text"],
      },
    },
    {
      name: "createRectShape",
      description:
        "Create a rectangle (category: creation, layout). Use for zones, quadrants, swimlanes, or SWOT backgrounds. Draw distinct rects with explicit x, y, width, height.",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          x: { type: SchemaType.NUMBER, description: "Top-left world x" },
          y: { type: SchemaType.NUMBER, description: "Top-left world y" },
          width: { type: SchemaType.NUMBER, description: "Width in world units" },
          height: {
            type: SchemaType.NUMBER,
            description: "Height in world units",
          },
        },
        required: ["x", "y", "width", "height"],
      },
    },
    {
      name: "moveObject",
      description:
        "Move an existing object by Firestore id (category: manipulation, layout). Use after reading ids from the board context. Works for sticky, rect, frame, text, circle, and line (lines translate as a whole).",
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          objectId: {
            type: SchemaType.STRING,
            description: "Firestore object id from board context",
          },
          x: { type: SchemaType.NUMBER, description: "New origin x" },
          y: { type: SchemaType.NUMBER, description: "New origin y" },
        },
        required: ["objectId", "x", "y"],
      },
    },
  ],
};
