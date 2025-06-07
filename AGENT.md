# FluentMCP Agent Configuration

## Commands
- **Build**: `npm run build` - Compiles TypeScript and copies JS files to dist/
- **Lint**: `npm run lint` - ESLint with TypeScript parser
- **Test**: `npm run test` - Runs vitest on specific test files
- **Test single**: `vitest run src/[filename].test.ts` - Run specific test file
- **Test watch**: `npm run test:watch` - Watch mode for tests
- **Typecheck**: `npm run typecheck` - TypeScript type checking without emit

## Code Style
- **Language**: TypeScript with ES2022 target and NodeNext modules
- **Imports**: ES modules (`import/export`), use `.js` extension for local imports
- **Types**: Strict TypeScript, explicit interfaces, avoid `any` (warn only)
- **Naming**: PascalCase for classes/interfaces, camelCase for functions/variables
- **Error handling**: Use try/catch blocks, prefer structured error responses
- **Console**: Use `no-console` ESLint rule (warn only)
- **Unused vars**: Prefix with `_` to ignore in ESLint

## Architecture
- Fluent/chainable API pattern with method chaining
- Zod schemas for validation and type safety
- MCP (Model Context Protocol) server implementation
- Resource-based data management with CRUD operations
