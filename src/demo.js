import { createMCP, createAdvancedMCP, z } from './fluent-mcp.js';

// Simple usage example
console.log('Creating a simple Notes API...');
const notesServer = createMCP('Simple Notes API', '1.0.0')
  // Define the Notes resource and CRUD operations
  .resource('Notes', {})
  .crud('Note', {
    title: z.string().describe('The title of the note'),
    content: z.string().describe('The content of the note'),
    tags: z.array(z.string()).optional().describe('Optional tags for the note')
  })
  
  // Add a custom search tool for notes
  .tool(
    'searchNotes',
    {
      query: z.string().describe('The search query')
    },
    async ({ query }) => {
      try {
        // Access the resources using the accessor method
        const notes = Object.values(notesServer.getResource('Notes'));
        
        // Filter notes based on the query
        const results = notes.filter(note => 
          note.title.toLowerCase().includes(query.toLowerCase()) || 
          note.content.toLowerCase().includes(query.toLowerCase())
        );
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                results,
                count: results.length,
                query
              }, null, 2)
            }
          ]
        };
      } catch (err) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: 'Failed to search notes',
                message: err instanceof Error ? err.message : 'Unknown error'
              }, null, 2)
            }
          ]
        };
      }
    }
  );

// Advanced usage example
console.log('Creating an advanced Task Manager API...');
const taskServer = createAdvancedMCP('Advanced Task Manager API', '1.0.0', {
  autoGenerateIds: false,  // We'll manage IDs ourselves
  timestampEntries: true   // But keep automatic timestamps
})
  // Define the Tasks resource with custom pluralization
  .resource('Tasks', {})
  .crud('Task', {
    id: z.string().describe('The unique ID of the task'),
    title: z.string().describe('The title of the task'),
    description: z.string().describe('The description of the task'),
    status: z.enum(['pending', 'in-progress', 'completed']).describe('The status of the task'),
    priority: z.enum(['low', 'medium', 'high']).describe('The priority of the task'),
    dueDate: z.string().optional().describe('The due date of the task (ISO string)'),
    tags: z.array(z.string()).optional().describe('Tags associated with the task')
  }, {
    singularName: 'Task',
    pluralName: 'Tasks'  // Explicit pluralization
  })
  
  // Define the Projects resource
  .resource('Projects', {})
  .crud('Project', {
    id: z.string().describe('The unique ID of the project'),
    name: z.string().describe('The name of the project'),
    description: z.string().describe('The description of the project'),
    status: z.enum(['active', 'on-hold', 'completed']).describe('The status of the project')
  })
  
  // Add a custom tool to filter tasks by status and priority
  .tool(
    'filterTasks',
    {
      status: z.enum(['pending', 'in-progress', 'completed']).optional().describe('Filter by status'),
      priority: z.enum(['low', 'medium', 'high']).optional().describe('Filter by priority'),
      dueBefore: z.string().optional().describe('Filter by due date (before this date)')
    },
    async ({ status, priority, dueBefore }) => {
      try {
        // Access the tasks resource
        const tasks = Object.values(taskServer.getResource('Tasks'));
        
        // Apply filters
        let filteredTasks = [...tasks];
        
        if (status) {
          filteredTasks = filteredTasks.filter(task => task.status === status);
        }
        
        if (priority) {
          filteredTasks = filteredTasks.filter(task => task.priority === priority);
        }
        
        if (dueBefore) {
          const beforeDate = new Date(dueBefore).getTime();
          filteredTasks = filteredTasks.filter(task => {
            if (!task.dueDate) return false;
            return new Date(task.dueDate).getTime() <= beforeDate;
          });
        }
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                tasks: filteredTasks,
                count: filteredTasks.length,
                filters: { status, priority, dueBefore }
              }, null, 2)
            }
          ]
        };
      } catch (err) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: 'Failed to filter tasks',
                message: err instanceof Error ? err.message : 'Unknown error'
              }, null, 2)
            }
          ]
        };
      }
    }
  );

// Start the servers one after another for demo purposes
async function startDemos() {
  try {
    // Start the simple notes server
    console.log('\n=== SIMPLE NOTES API ===');
    console.log('Available tools:');
    console.log('- getNote: Retrieve a note by ID');
    console.log('- getAllNotes: Get all notes');
    console.log('- createNote: Create a new note');
    console.log('- updateNote: Update an existing note');
    console.log('- deleteNote: Delete a note');
    console.log('- searchNotes: Search notes by title or content');
    
    await notesServer.start();
    console.log('Simple Notes API started successfully');
    
    // We would normally start the second server here, but for demo purposes
    // we'll just show the configuration
    console.log('\n=== ADVANCED TASK MANAGER API ===');
    console.log('Available tools:');
    console.log('- getTask, getAllTasks, createTask, updateTask, deleteTask');
    console.log('- getProject, getAllProjects, createProject, updateProject, deleteProject');
    console.log('- filterTasks: Filter tasks by status, priority, and due date');
    
    // In a real scenario, you would uncomment this to start the second server
    // await taskServer.start();
    // console.log('Advanced Task Manager API started successfully');
    
  } catch (err) {
    console.error('Failed to start servers:', err);
  }
}

// Run the demo
startDemos();