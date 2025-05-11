// Simple in-memory notes storage
export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export class NotesStore {
  private notes: Record<string, Note>;

  constructor() {
    // Initialize with some sample notes
    this.notes = {
      "note1": {
        id: "note1",
        title: "Sample Note 1",
        content: "This is a sample note content.",
        createdAt: new Date().toISOString()
      },
      "note2": {
        id: "note2",
        title: "Sample Note 2",
        content: "This is another sample note.",
        createdAt: new Date().toISOString()
      }
    };
  }

  getNote(id: string): Note | undefined {
    return this.notes[id];
  }

  getAllNotes(): Note[] {
    return Object.values(this.notes);
  }

  createNote(title: string, content: string): Note {
    const id = `note${Date.now()}`;
    const newNote = {
      id,
      title,
      content,
      createdAt: new Date().toISOString()
    };
    
    this.notes[id] = newNote;
    return newNote;
  }

  updateNote(id: string, updates: { title?: string; content?: string }): Note | undefined {
    const note = this.notes[id];
    
    if (!note) {
      return undefined;
    }

    if (updates.title !== undefined) {
      note.title = updates.title;
    }

    if (updates.content !== undefined) {
      note.content = updates.content;
    }
    
    return note;
  }

  deleteNote(id: string): boolean {
    const note = this.notes[id];
    
    if (!note) {
      return false;
    }

    delete this.notes[id];
    return true;
  }
}

// Export a singleton instance
export const notesStore = new NotesStore();
