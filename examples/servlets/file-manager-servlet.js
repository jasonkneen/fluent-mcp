#!/usr/bin/env node

/**
 * File Manager Servlet - File system operations MCP server
 *
 * This servlet provides file system operations within a sandboxed
 * working directory. It can list, read, write, and manage files.
 *
 * SECURITY NOTE: This servlet operates within a configurable base
 * directory and prevents path traversal attacks.
 *
 * Usage:
 *   node file-manager-servlet.js [--base-dir /path/to/directory]
 *
 * Tools provided:
 *   - listFiles: List files in a directory
 *   - readFile: Read file contents
 *   - writeFile: Write content to a file
 *   - createDirectory: Create a new directory
 *   - deleteFile: Delete a file or directory
 *   - moveFile: Move/rename a file
 *   - getFileInfo: Get file metadata
 *   - searchFiles: Search for files by pattern
 */

import { createMCP } from '../../dist/fluent-mcp.js';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';

// Parse command line arguments
const args = process.argv.slice(2);
const baseDirIndex = args.indexOf('--base-dir');
const baseDir = baseDirIndex !== -1 && args[baseDirIndex + 1]
  ? path.resolve(args[baseDirIndex + 1])
  : process.cwd();

// Validate and resolve path within base directory
function resolveSafePath(inputPath) {
  const resolved = path.resolve(baseDir, inputPath);

  // Prevent path traversal
  if (!resolved.startsWith(baseDir)) {
    throw new Error('Path traversal not allowed');
  }

  return resolved;
}

// Get relative path from base
function getRelativePath(fullPath) {
  return path.relative(baseDir, fullPath);
}

// Format file size
function formatSize(bytes) {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

createMCP('file-manager-servlet', '1.0.0')
  // List files in directory
  .tool(
    'listFiles',
    {
      path: z.string().optional().describe('Directory path relative to base (default: root)'),
      recursive: z.boolean().optional().describe('List files recursively'),
      showHidden: z.boolean().optional().describe('Show hidden files (starting with .)'),
    },
    async ({ path: dirPath = '.', recursive = false, showHidden = false }) => {
      try {
        const fullPath = resolveSafePath(dirPath);
        const entries = [];

        async function scanDir(dir, depth = 0) {
          const items = await fs.readdir(dir, { withFileTypes: true });

          for (const item of items) {
            if (!showHidden && item.name.startsWith('.')) continue;

            const itemPath = path.join(dir, item.name);
            const stats = await fs.stat(itemPath);

            entries.push({
              name: item.name,
              path: getRelativePath(itemPath),
              type: item.isDirectory() ? 'directory' : 'file',
              size: item.isFile() ? formatSize(stats.size) : null,
              modified: stats.mtime.toISOString(),
              depth,
            });

            if (recursive && item.isDirectory()) {
              await scanDir(itemPath, depth + 1);
            }
          }
        }

        await scanDir(fullPath);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              basePath: getRelativePath(fullPath) || '.',
              count: entries.length,
              entries,
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
            }, null, 2)
          }]
        };
      }
    }
  )

  // Read file contents
  .tool(
    'readFile',
    {
      path: z.string().describe('File path relative to base'),
      encoding: z.enum(['utf8', 'base64', 'hex']).optional().describe('File encoding (default: utf8)'),
    },
    async ({ path: filePath, encoding = 'utf8' }) => {
      try {
        const fullPath = resolveSafePath(filePath);
        const stats = await fs.stat(fullPath);

        if (stats.isDirectory()) {
          throw new Error('Cannot read directory as file');
        }

        // Limit file size for safety
        if (stats.size > 10 * 1024 * 1024) {
          throw new Error('File too large (max 10MB)');
        }

        const content = await fs.readFile(fullPath, encoding);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              path: getRelativePath(fullPath),
              size: formatSize(stats.size),
              encoding,
              content: encoding === 'utf8' ? content : content.toString(),
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
            }, null, 2)
          }]
        };
      }
    }
  )

  // Write file contents
  .tool(
    'writeFile',
    {
      path: z.string().describe('File path relative to base'),
      content: z.string().describe('Content to write'),
      createDirs: z.boolean().optional().describe('Create parent directories if needed'),
      append: z.boolean().optional().describe('Append to file instead of overwriting'),
    },
    async ({ path: filePath, content, createDirs = true, append = false }) => {
      try {
        const fullPath = resolveSafePath(filePath);

        // Create parent directories if needed
        if (createDirs) {
          await fs.mkdir(path.dirname(fullPath), { recursive: true });
        }

        if (append) {
          await fs.appendFile(fullPath, content, 'utf8');
        } else {
          await fs.writeFile(fullPath, content, 'utf8');
        }

        const stats = await fs.stat(fullPath);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              path: getRelativePath(fullPath),
              size: formatSize(stats.size),
              action: append ? 'appended' : 'written',
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
            }, null, 2)
          }]
        };
      }
    }
  )

  // Create directory
  .tool(
    'createDirectory',
    {
      path: z.string().describe('Directory path relative to base'),
      recursive: z.boolean().optional().describe('Create parent directories if needed'),
    },
    async ({ path: dirPath, recursive = true }) => {
      try {
        const fullPath = resolveSafePath(dirPath);
        await fs.mkdir(fullPath, { recursive });

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              path: getRelativePath(fullPath),
              created: true,
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
            }, null, 2)
          }]
        };
      }
    }
  )

  // Delete file or directory
  .tool(
    'deleteFile',
    {
      path: z.string().describe('Path to delete relative to base'),
      recursive: z.boolean().optional().describe('Delete directories recursively'),
    },
    async ({ path: targetPath, recursive = false }) => {
      try {
        const fullPath = resolveSafePath(targetPath);
        const stats = await fs.stat(fullPath);

        if (stats.isDirectory()) {
          await fs.rm(fullPath, { recursive });
        } else {
          await fs.unlink(fullPath);
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              path: getRelativePath(fullPath),
              type: stats.isDirectory() ? 'directory' : 'file',
              deleted: true,
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
            }, null, 2)
          }]
        };
      }
    }
  )

  // Move/rename file
  .tool(
    'moveFile',
    {
      from: z.string().describe('Source path relative to base'),
      to: z.string().describe('Destination path relative to base'),
    },
    async ({ from, to }) => {
      try {
        const fromPath = resolveSafePath(from);
        const toPath = resolveSafePath(to);

        // Create parent directories for destination
        await fs.mkdir(path.dirname(toPath), { recursive: true });
        await fs.rename(fromPath, toPath);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              from: getRelativePath(fromPath),
              to: getRelativePath(toPath),
              moved: true,
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
            }, null, 2)
          }]
        };
      }
    }
  )

  // Get file info
  .tool(
    'getFileInfo',
    {
      path: z.string().describe('File path relative to base'),
    },
    async ({ path: filePath }) => {
      try {
        const fullPath = resolveSafePath(filePath);
        const stats = await fs.stat(fullPath);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              path: getRelativePath(fullPath),
              type: stats.isDirectory() ? 'directory' : 'file',
              size: stats.isFile() ? formatSize(stats.size) : null,
              sizeBytes: stats.isFile() ? stats.size : null,
              created: stats.birthtime.toISOString(),
              modified: stats.mtime.toISOString(),
              accessed: stats.atime.toISOString(),
              permissions: stats.mode.toString(8).slice(-3),
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
            }, null, 2)
          }]
        };
      }
    }
  )

  // Search files
  .tool(
    'searchFiles',
    {
      pattern: z.string().describe('Search pattern (glob-like: *.txt, **.js)'),
      path: z.string().optional().describe('Starting directory (default: root)'),
      maxResults: z.number().optional().describe('Maximum results to return'),
    },
    async ({ pattern, path: startPath = '.', maxResults = 100 }) => {
      try {
        const fullPath = resolveSafePath(startPath);
        const results = [];

        // Simple glob matching
        const regexPattern = pattern
          .replace(/\./g, '\\.')
          .replace(/\*\*/g, '{{GLOBSTAR}}')
          .replace(/\*/g, '[^/]*')
          .replace(/{{GLOBSTAR}}/g, '.*');
        const regex = new RegExp(`^${regexPattern}$`, 'i');

        async function search(dir) {
          if (results.length >= maxResults) return;

          const items = await fs.readdir(dir, { withFileTypes: true });

          for (const item of items) {
            if (results.length >= maxResults) return;

            const itemPath = path.join(dir, item.name);
            const relativePath = getRelativePath(itemPath);

            if (regex.test(item.name) || regex.test(relativePath)) {
              results.push({
                name: item.name,
                path: relativePath,
                type: item.isDirectory() ? 'directory' : 'file',
              });
            }

            if (item.isDirectory()) {
              await search(itemPath);
            }
          }
        }

        await search(fullPath);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              pattern,
              count: results.length,
              truncated: results.length >= maxResults,
              results,
            }, null, 2)
          }]
        };
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
            }, null, 2)
          }]
        };
      }
    }
  )

  .stdio()
  .start()
  .then(() => {
    console.error(`File Manager Servlet started. Base directory: ${baseDir}`);
  })
  .catch((err) => {
    console.error('File manager servlet failed to start:', err);
    process.exit(1);
  });
