import { randomUUID } from 'node:crypto'

import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp'
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types'
import type { Request, Response } from 'express'

import TransportManager from './transportManager'

interface Options {
  getServer: () => McpServer
  port: number
  token: string
  allowedHosts?: string[]
}

function createAuthMiddleware(token: string) {
  return function authMiddleware(req: Request, res: Response, next: () => void) {
    const authHeader = req.headers.authorization
    if (!authHeader || authHeader !== `Bearer ${token}`) {
      res.status(401).json({
        jsonrpc: '2.0',
        error: {
          code: -32_000,
          message: 'Unauthorized: No valid token provided',
        },
        id: null,
      })
      return
    }

    next()
  }
}

export default function createStreamMcpServer({ getServer, port, token, allowedHosts }: Options) {
  const app = createMcpExpressApp({
    allowedHosts,
  })

  const transportManager = new TransportManager<StreamableHTTPServerTransport>()

  const authMiddleware = createAuthMiddleware(token)

  app.post('/mcp', authMiddleware, async (req: Request, res: Response) => {
    try {
      // Check for existing session ID
      const sessionId = req.headers['mcp-session-id'] as string | undefined
      let transport = sessionId ? transportManager.getTransport(sessionId) : undefined

      if (!!transport) {
      } else if (!sessionId && isInitializeRequest(req.body)) {
        // New initialization request - use JSON response mode
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          enableJsonResponse: true, // Enable JSON response mode
          onsessioninitialized: (sessionId) => {
            // Store the transport by session ID when session is initialized
            // This avoids race conditions where requests might come in before the session is stored
            console.log(`Session initialized with ID: ${sessionId}`)
            transportManager.addTransport(sessionId, transport!)
          },
        })

        // Connect the transport to the MCP server BEFORE handling the request
        const server = getServer()
        await server.connect(transport)
        await transport.handleRequest(req, res, req.body)
        return // Already handled
      } else {
        // Invalid request - no session ID or not initialization request
        res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32_000,
            message: 'Bad Request: No valid session ID provided',
          },
          id: null,
        })
        return
      }

      // Handle the request with existing transport - no need to reconnect
      await transport.handleRequest(req, res, req.body)
    } catch (error) {
      console.error('Error handling MCP request:', error)
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32_603,
            message: 'Internal server error',
          },
          id: null,
        })
      }
    }
  })

  // Handle GET requests for SSE streams according to spec
  app.get('/mcp', authMiddleware, async (req: Request, res: Response) => {
    // Since this is a very simple example, we don't support GET requests for this server
    // The spec requires returning 405 Method Not Allowed in this case
    res.status(405).set('Allow', 'POST').send('Method Not Allowed')
  })

  // Start the server
  app.listen(port, (error) => {
    console.log(`MCP Streamable HTTP Server listening on port ${port}`)
  })
}
