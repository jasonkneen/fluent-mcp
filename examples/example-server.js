"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var fluent_mcp_js_1 = require("./fluent-mcp.js");
var zod_1 = require("zod");
// Create a new MCP server with fluent interface
var server = (0, fluent_mcp_js_1.createMCP)('Notes API', '1.0.0')
    // Define the Note schema
    .resource('Notes', {})
    // Create CRUD operations for Notes
    .crud('Note', {
    title: zod_1.z.string().describe('The title of the note'),
    content: zod_1.z.string().describe('The content of the note')
})
    // Add a custom tool
    .tool('searchNotes', {
    query: zod_1.z.string().describe('The search query')
}, function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
    var notes, results, errorMessage;
    var query = _b.query;
    return __generator(this, function (_c) {
        try {
            notes = Object.values(server.getResource('Notes'));
            results = notes.filter(function (note) {
                return note.title.toLowerCase().includes(query.toLowerCase()) ||
                    note.content.toLowerCase().includes(query.toLowerCase());
            });
            return [2 /*return*/, {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                success: true,
                                results: results,
                                count: results.length
                            })
                        }
                    ]
                }];
        }
        catch (err) {
            errorMessage = err instanceof Error ? err.message : 'Unknown error';
            return [2 /*return*/, {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify({
                                success: false,
                                error: 'Failed to search notes',
                                message: errorMessage
                            })
                        }
                    ]
                }];
        }
        return [2 /*return*/];
    });
}); });
// Start the server
server.start().catch(function (err) {
    // Log to stderr instead of stdout to avoid interfering with the MCP protocol
    console.error('Failed to start server:', err instanceof Error ? err.message : err);
    process.exit(1);
});
