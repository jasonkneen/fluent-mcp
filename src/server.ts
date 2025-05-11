import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { notesStore } from "./notes-store.js";

// Create the MCP server instance
const server = new McpServer({
  name: "Simple Notes API",
  version: "1.0.0",
});

// Get a note by ID
server.tool(
  "getNote",
  {
    noteId: z.string().describe("The ID of the note to retrieve")
  },
  async ({ noteId }) => {
    try {
      const note = notesStore.getNote(noteId);
      
      if (!note) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: "Note not found",
                noteId
              }, null, 2)
            }
          ]
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              note
            }, null, 2)
          }
        ]
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: "Failed to retrieve note",
              noteId
            }, null, 2)
          }
        ]
      };
    }
  },
);

// Get all notes
server.tool(
  "getAllNotes",
  {},
  async () => {
    try {
      const notesList = notesStore.getAllNotes();
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              notes: notesList
            }, null, 2)
          }
        ]
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: "Failed to retrieve notes"
            }, null, 2)
          }
        ]
      };
    }
  },
);

// Create a new note
server.tool(
  "createNote",
  {
    title: z.string().describe("The title of the note"),
    content: z.string().describe("The content of the note")
  },
  async ({ title, content }) => {
    try {
      const newNote = notesStore.createNote(title, content);
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              note: newNote
            }, null, 2)
          }
        ]
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: "Failed to create note"
            }, null, 2)
          }
        ]
      };
    }
  },
);

// Update an existing note
server.tool(
  "updateNote",
  {
    noteId: z.string().describe("The ID of the note to update"),
    title: z.string().optional().describe("The updated title of the note"),
    content: z.string().optional().describe("The updated content of the note")
  },
  async ({ noteId, title, content }) => {
    try {
      const updatedNote = notesStore.updateNote(noteId, { title, content });
      
      if (!updatedNote) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: "Note not found",
                noteId
              }, null, 2)
            }
          ]
        };
      }
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              note: updatedNote
            }, null, 2)
          }
        ]
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: "Failed to update note",
              noteId
            }, null, 2)
          }
        ]
      };
    }
  },
);

// Delete a note
server.tool(
  "deleteNote",
  {
    noteId: z.string().describe("The ID of the note to delete")
  },
  async ({ noteId }) => {
    try {
      const deleted = notesStore.deleteNote(noteId);
      
      if (!deleted) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: false,
                error: "Note not found",
                noteId
              }, null, 2)
            }
          ]
        };
      }
      
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              message: "Note deleted successfully",
              noteId
            }, null, 2)
          }
        ]
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: false,
              error: "Failed to delete note",
              noteId
            }, null, 2)
          }
        ]
      };
    }
  },
);

// Connect to the transport
const transport = new StdioServerTransport();
await server.connect(transport);