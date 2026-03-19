import { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import { type CallToolResult } from '@modelcontextprotocol/sdk/types'
import { z } from 'zod'

import 'dotenv/config'

import createStreamMcpServer from './createStreamMcpServer'

import { spawn } from 'child_process'
import { readdir, readFile, writeFile, stat } from 'fs/promises'
import { existsSync } from 'fs'
import { join, resolve } from 'path'

const PORT = Number(process.env.PORT) || 3000
const token = process.env.AUTH_TOKEN || ''
const allowDir = process.env.ALLOWED_DIR || process.cwd()
const allowedHosts = process.env.ALLOWED_HOSTS?.split(',') || ['localhost', '127.0.0.1', '[::1]']

const resolvedAllowedDir = resolve(allowDir)

function validatePath(requestedPath: string): string {
  if (requestedPath.startsWith(resolvedAllowedDir)) {
    return requestedPath
  }
  return resolve(resolvedAllowedDir, requestedPath)
}

// Create an MCP server with implementation details
const getServer = () => {
  const server = new McpServer(
    {
      name: 'remote-code-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        logging: {},
      },
    },
  )

  // Register execute_command tool
  server.registerTool(
    'execute_command',
    {
      description: 'Execute a shell command in the specified working directory',
      inputSchema: z.object({
        command: z.string().describe('The command to execute'),
        cwd: z
          .string()
          .describe('Working directory for the command (optional, defaults to current directory)')
          .optional(),
      }),
    },
    async ({ command, cwd }): Promise<CallToolResult> => {
      const workingDir = cwd ? resolve(cwd) : process.cwd()

      return new Promise((resolvePromise, reject) => {
        const result = {
          stdout: '',
          stderr: '',
          exitCode: 0,
        }

        const proc = spawn(command, {
          shell: true,
          cwd: workingDir,
          env: process.env,
        })

        proc.stdout.on('data', (data) => {
          result.stdout += data.toString()
        })

        proc.stderr.on('data', (data) => {
          result.stderr += data.toString()
        })

        proc.on('close', (code) => {
          result.exitCode = code || 0
          resolvePromise({
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          })
        })

        proc.on('error', (error) => {
          reject(new Error(`Failed to execute command: ${error.message}`))
        })
      })
    },
  )

  // Register list_directory tool
  server.registerTool(
    'list_directory',
    {
      description: 'List files and directories in a specified path',
      inputSchema: z.object({
        path: z.string().describe('The path to list (optional, defaults to current directory)').optional(),
        recursive: z.boolean().describe('Whether to list recursively (optional, defaults to false)').optional(),
      }),
    },
    async ({ path: targetPath, recursive }): Promise<CallToolResult> => {
      const basePath = targetPath ? validatePath(targetPath) : resolvedAllowedDir

      if (!existsSync(basePath)) {
        return {
          content: [
            {
              type: 'text',
              text: '[]',
            },
          ],
        }
      }

      const stats = await stat(basePath)
      if (!stats.isDirectory()) {
        throw new Error(`Path is not a directory: ${basePath}`)
      }

      const results: Array<{ name: string; path: string; type: 'file' | 'directory' }> = []

      async function scanDirectory(dirPath: string, relativePath: string = '') {
        const entries = await readdir(dirPath, { withFileTypes: true })

        for (const entry of entries) {
          const fullPath = join(dirPath, entry.name)
          const relativeEntryPath = join(relativePath, entry.name)

          results.push({
            name: entry.name,
            path: fullPath,
            type: entry.isDirectory() ? 'directory' : 'file',
          })

          if (recursive && entry.isDirectory()) {
            await scanDirectory(fullPath, relativeEntryPath)
          }
        }
      }

      await scanDirectory(basePath)

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(results, null, 2),
          },
        ],
      }
    },
  )

  // Register write_file tool
  server.registerTool(
    'write_file',
    {
      description: 'Write content to a file',
      inputSchema: z.object({
        path: z.string().describe('The file path to write to'),
        content: z.string().describe('The content to write to the file'),
      }),
    },
    async ({ path: filePath, content }): Promise<CallToolResult> => {
      const resolvedPath = validatePath(filePath)

      await writeFile(resolvedPath, content, 'utf-8')

      return {
        content: [
          {
            type: 'text',
            text: `Successfully wrote to file: ${resolvedPath}`,
          },
        ],
      }
    },
  )

  // Register read_file tool
  server.registerTool(
    'read_file',
    {
      description: 'Read content from a file',
      inputSchema: z.object({
        path: z.string().describe('The file path to read from'),
      }),
    },
    async ({ path: filePath }): Promise<CallToolResult> => {
      const resolvedPath = validatePath(filePath)

      if (!existsSync(resolvedPath)) {
        throw new Error(`File does not exist: ${resolvedPath}`)
      }

      const stats = await stat(resolvedPath)
      if (stats.isDirectory()) {
        throw new Error(`Path is a directory, not a file: ${resolvedPath}`)
      }

      const content = await readFile(resolvedPath, 'utf-8')

      return {
        content: [
          {
            type: 'text',
            text: content,
          },
        ],
      }
    },
  )

  // Register search_files tool
  server.registerTool(
    'search_files',
    {
      description: 'Search for files containing a keyword in a directory',
      inputSchema: z.object({
        keyword: z.string().describe('The keyword to search for'),
        path: z
          .string()
          .describe('The directory path to search in (optional, defaults to current directory)')
          .optional(),
        filePattern: z.string().describe('File pattern to match (e.g., "*.js", "*.ts") (optional)').optional(),
        maxResults: z.number().describe('Maximum number of results to return (optional, defaults to 50)').optional(),
      }),
    },
    async ({ keyword, path: targetPath, filePattern, maxResults = 50 }): Promise<CallToolResult> => {
      const basePath = targetPath ? validatePath(targetPath) : resolvedAllowedDir

      if (!existsSync(basePath)) {
        throw new Error(`Path does not exist: ${basePath}`)
      }

      const results: Array<{ file: string; line: number; content: string }> = []

      async function searchInFile(filePath: string): Promise<boolean> {
        try {
          const content = await readFile(filePath, 'utf-8')
          const lines = content.split('\n')

          for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(keyword)) {
              results.push({
                file: filePath,
                line: i + 1,
                content: lines[i].trim(),
              })

              if (results.length >= maxResults) {
                return true
              }
            }
          }
        } catch (error) {
          return false
        }
        return false
      }

      async function searchDirectory(dirPath: string) {
        const entries = await readdir(dirPath, { withFileTypes: true })

        for (const entry of entries) {
          if (results.length >= maxResults) {
            return
          }

          const fullPath = join(dirPath, entry.name)

          try {
            validatePath(fullPath)
          } catch (error) {
            continue
          }

          if (entry.isDirectory()) {
            await searchDirectory(fullPath)
          } else if (entry.isFile()) {
            if (!filePattern || entry.name.endsWith(filePattern.replace('*', ''))) {
              const stop = await searchInFile(fullPath)
              if (stop) return
            }
          }
        }
      }

      await searchDirectory(basePath)

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(results, null, 2),
          },
        ],
      }
    },
  )

  return server
}

createStreamMcpServer({
  getServer,
  port: PORT,
  token,
  allowedHosts,
})
