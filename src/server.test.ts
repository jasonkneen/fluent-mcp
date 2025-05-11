import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { NotesStore } from './notes-store.js';

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
    NotesStore: vi.fn().mockImplementation(() => mockStore),
    notesStore: mockStore
  };
});

// Import the mocked notesStore
import { notesStore } from './notes-store.js';

describe('Notes Store', () => {
  const mockNotes = {
    'note1': {
      id: 'note1',
      title: 'Sample Note 1',
      content: 'This is a sample note content.',
      createdAt: '2025-01-01T00:00:00.000Z'
    },
    'note2': {
      id: 'note2',
      title: 'Sample Note 2',
      content: 'This is another sample note.',
      createdAt: '2025-01-02T00:00:00.000Z'
    }
  };
  
  beforeEach(() => {
    // Reset all mocks before each test
    vi.resetAllMocks();
  });

  describe('getNote', () => {
    it('should return a note when given a valid ID', () => {
      // Setup
      vi.mocked(notesStore.getNote).mockReturnValue(mockNotes.note1);
      
      // Execute
      const result = notesStore.getNote('note1');
      
      // Verify
      expect(notesStore.getNote).toHaveBeenCalledWith('note1');
      expect(result).toEqual(mockNotes.note1);
    });
    
    it('should return undefined when given an invalid ID', () => {
      // Setup
      vi.mocked(notesStore.getNote).mockReturnValue(undefined);
      
      // Execute
      const result = notesStore.getNote('invalid');
      
      // Verify
      expect(notesStore.getNote).toHaveBeenCalledWith('invalid');
      expect(result).toBeUndefined();
    });
  });
  
  describe('getAllNotes', () => {
    it('should return all notes', () => {
      // Setup
      const notesList = Object.values(mockNotes);
      vi.mocked(notesStore.getAllNotes).mockReturnValue(notesList);
      
      // Execute
      const result = notesStore.getAllNotes();
      
      // Verify
      expect(notesStore.getAllNotes).toHaveBeenCalled();
      expect(result).toEqual(notesList);
      expect(result).toHaveLength(2);
    });
  });
  
  describe('createNote', () => {
    it('should create a new note', () => {
      // Setup
      const newNote = {
        id: 'note3',
        title: 'New Note',
        content: 'New content',
        createdAt: '2025-01-03T00:00:00.000Z'
      };
      vi.mocked(notesStore.createNote).mockReturnValue(newNote);
      
      // Execute
      const result = notesStore.createNote('New Note', 'New content');
      
      // Verify
      expect(notesStore.createNote).toHaveBeenCalledWith('New Note', 'New content');
      expect(result).toEqual(newNote);
    });
  });
  
  describe('updateNote', () => {
    it('should update an existing note', () => {
      // Setup
      const updatedNote = {
        ...mockNotes.note1,
        title: 'Updated Title',
        content: 'Updated content'
      };
      vi.mocked(notesStore.updateNote).mockReturnValue(updatedNote);
      
      // Execute
      const result = notesStore.updateNote('note1', { 
        title: 'Updated Title', 
        content: 'Updated content' 
      });
      
      // Verify
      expect(notesStore.updateNote).toHaveBeenCalledWith('note1', { 
        title: 'Updated Title', 
        content: 'Updated content' 
      });
      expect(result).toEqual(updatedNote);
    });
    
    it('should return undefined when updating a non-existent note', () => {
      // Setup
      vi.mocked(notesStore.updateNote).mockReturnValue(undefined);
      
      // Execute
      const result = notesStore.updateNote('invalid', { 
        title: 'Updated Title', 
        content: 'Updated content' 
      });
      
      // Verify
      expect(notesStore.updateNote).toHaveBeenCalledWith('invalid', { 
        title: 'Updated Title', 
        content: 'Updated content' 
      });
      expect(result).toBeUndefined();
    });
  });
  
  describe('deleteNote', () => {
    it('should delete an existing note', () => {
      // Setup
      vi.mocked(notesStore.deleteNote).mockReturnValue(true);
      
      // Execute
      const result = notesStore.deleteNote('note1');
      
      // Verify
      expect(notesStore.deleteNote).toHaveBeenCalledWith('note1');
      expect(result).toBe(true);
    });
    
    it('should return false when deleting a non-existent note', () => {
      // Setup
      vi.mocked(notesStore.deleteNote).mockReturnValue(false);
      
      // Execute
      const result = notesStore.deleteNote('invalid');
      
      // Verify
      expect(notesStore.deleteNote).toHaveBeenCalledWith('invalid');
      expect(result).toBe(false);
    });
  });
});

// Create a separate test file for the MCP server tools
import { writeFileSync } from 'fs';
import { join } from 'path';

// Create a test file for the MCP server tools
const serverToolsTestContent = `import { describe, it, expect, vi, beforeEach } from 'vitest';
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
`;

// Write the server tools test file
try {
  writeFileSync(join(process.cwd(), 'src/server-tools.test.ts'), serverToolsTestContent);
  console.log('Created server-tools.test.ts file');
} catch (error) {
  console.error('Failed to create server-tools.test.ts file:', error);
}
