# OpenCode.md - MCP Server TS

## Commands
- Build: `npm run build`
- Start: `npm run start`
- Development: `npm run dev`
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`
- Test all: `npm test`
- Test single: `npm run test:single path/to/test.ts`
- Test watch: `npm run test:watch`

## Code Style Guidelines
- **Imports**: Use ES module imports with `.js` extension for local files
- **Types**: Use Zod for runtime validation, TypeScript for static typing
- **Naming**: camelCase for variables/functions, PascalCase for classes/types
- **Error Handling**: Use try/catch blocks with specific error messages
- **Formatting**: 2-space indentation, semicolons required
- **Environment Variables**: Use dotenv, reference with process.env
- **Async**: Use async/await pattern for asynchronous operations
- **API Calls**: Use fetch API with proper error handling
- **Response Format**: Return structured content objects with type field
- **MCP SDK**: Use @modelcontextprotocol/sdk version 1.11.1 or higher