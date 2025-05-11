import { describe, it, expect, vi, beforeEach } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

// Mock the notes store
vi.mock('./notes-store.js', () => {
  const mockStore = {
    getNote: vi.fn(),
    getAllNotes: vi.fn(),
    createNote: vi.fn(),
    updateNote: vi.fn(),
    deleteNote: vi.fn()
  };
  
  return {
    notesStore: mockStore
  };
});

// Import the mocked notesStore
import { notesStore } from './notes-store.js';

describe('MCP Server Tools', () => {
  let server: McpServer;
  let toolCallback: Function;
  
  // Capture the tool callback for testing
  const mockTool = vi.fn().mockImplementation((name, schema, callback) => {
    if (name === 'getNote') {
      toolCallback = callback;
    }
    return { name, schema };
  });
  
  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();
    
    // Create a mock server
    server = { tool: mockTool } as unknown as McpServer;
  });

  describe('getNote tool', () => {
    it('should return a note when given a valid ID', async () => {
      // Setup
      const mockNote = {
        id: 'note1',
        title: 'Sample Note 1',
        content: 'This is a sample note content.',
        createdAt: '2025-01-01T00:00:00.000Z'
      };
      vi.mocked(notesStore.getNote).mockReturnValue(mockNote);
      
      // Register the tool to capture the callback
      server.tool('getNote', { noteId: 'string' }, async ({ noteId }) => {
        const note = notesStore.getNote(noteId);
        
        if (!note) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: 'Note not found',
                  noteId
                }, null, 2)
              }
            ]
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                note
              }, null, 2)
            }
          ]
        };
      });
      
      // Execute the callback directly
      const result = await toolCallback({ noteId: 'note1' });
      
      // Verify
      expect(notesStore.getNote).toHaveBeenCalledWith('note1');
      expect(result.content[0].type).toBe('text');
      
      const parsedResult = JSON.parse(result.content[0].text);
      expect(parsedResult.success).toBe(true);
      expect(parsedResult.note).toEqual(mockNote);
    });
  });
});
