import { z } from 'zod';

export interface ToolDefinition {
  id: string;
  description: string;
  schema: Record<string, any>;
  handler: (params: any) => Promise<ToolResponse>;
}

export interface ToolResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
}

export interface McpServerConfig {
  name: string;
  version: string;
  capabilities: string[];
}

// JSON-RPC 2.0 schemas
const requestSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number()]),
  method: z.string(),
  params: z.any().optional(),
});

const responseSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.union([z.string(), z.number(), z.null()]),
  result: z.any().optional(),
  error: z.object({
    code: z.number(),
    message: z.string(),
    data: z.any().optional(),
  }).optional(),
});

type JsonRpcRequest = z.infer<typeof requestSchema>;
type JsonRpcResponse = z.infer<typeof responseSchema>;

export class McpServer {
  public capabilities: string[];
  private tools: Map<string, ToolDefinition>;
  private name: string;
  private version: string;
  
  constructor(config: McpServerConfig) {
    this.name = config.name;
    this.version = config.version;
    this.capabilities = config.capabilities;
    this.tools = new Map();
  }
  
  tool(
    id: string, 
    description: string, 
    schema: Record<string, any>, 
    handler: (params: any) => Promise<ToolResponse>
  ): void {
    this.tools.set(id, {
      id,
      description,
      schema,
      handler
    });
  }
  
  async handleRequest(rawRequest: any): Promise<JsonRpcResponse> {
    try {
      console.error(`Handling request: ${JSON.stringify(rawRequest)}`);
      
      // Validate the request against the JSON-RPC 2.0 schema
      const parseResult = requestSchema.safeParse(rawRequest);
      if (!parseResult.success) {
        console.error(`Invalid request format: ${JSON.stringify(parseResult.error)}`);
        return {
          jsonrpc: '2.0',
          id: rawRequest.id || null,
          error: {
            code: -32600,
            message: 'Invalid Request',
            data: parseResult.error,
          },
        };
      }
      
      const request = parseResult.data;
      
      // Handle different methods
      if (request.method === 'ping') {
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            server: this.name,
            version: this.version,
            capabilities: this.capabilities
          }
        };
      }
      
      // Handle initialization request from Claude Desktop
      if (request.method === 'initialize') {
        console.error(`Handling initialize method with params: ${JSON.stringify(request.params)}`);
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            serverInfo: {
              name: this.name,
              version: this.version
            },
            capabilities: {
              tools: this.capabilities.map(toolId => ({
                id: toolId,
                schema: this.tools.get(toolId)?.schema || {}
              }))
            },
            protocolVersion: request.params?.protocolVersion || '2024-11-05'
          }
        };
      }
      
      // Handle tool discovery request
      if (request.method === 'toolDiscovery') {
        console.error(`Handling toolDiscovery method`);
        
        // Collect tool definitions
        const toolDefinitions = [];
        for (const [id, tool] of this.tools.entries()) {
          toolDefinitions.push({
            id: tool.id,
            description: tool.description,
            schema: tool.schema
          });
        }
        
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            tools: toolDefinitions
          }
        };
      }
      
      if (request.method === 'toolCall') {
        const { id: toolId, params } = request.params as { id: string; params: any };
        console.error(`Handling toolCall for ${toolId} with params: ${JSON.stringify(params)}`);
        
        const tool = this.tools.get(toolId);
        
        if (!tool) {
          console.error(`Tool not found: ${toolId}`);
          return {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32601,
              message: `Tool ${toolId} not found`,
            }
          };
        }
        
        try {
          const result = await tool.handler(params);
          console.error(`Tool ${toolId} executed successfully`);
          return {
            jsonrpc: '2.0',
            id: request.id,
            result
          };
        } catch (error) {
          console.error(`Error executing tool ${toolId}:`, error);
          return {
            jsonrpc: '2.0',
            id: request.id,
            error: {
              code: -32000,
              message: error instanceof Error ? error.message : String(error)
            }
          };
        }
      }
      
      // Log other methods that we don't handle
      console.error(`Unhandled method: ${request.method}`);
      
      // Handle filesystem methods with graceful degradation
      const filesystemMethods = [
        'move_file', 'search_files', 'get_file_info', 
        'list_allowed_directories', 'read_file', 'write_file', 
        'list_directory', 'create_directory'
      ];
      
      if (filesystemMethods.includes(request.method)) {
        console.error(`Received filesystem method: ${request.method} - Responding with unsupported method`);
        return {
          jsonrpc: '2.0',
          id: request.id,
          error: {
            code: -32601,
            message: `Method ${request.method} not supported by this MCP server`
          }
        };
      }
      
      return {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32601,
          message: `Method ${request.method} not found`
        }
      };
    } catch (error) {
      console.error('Error handling request:', error);
      return {
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32603,
          message: 'Internal error',
          data: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }
  
  async connect(transport: StdioServerTransport) {
    console.error('Connecting MCP server...');
    await transport.start(this);
    
    // Keep the process alive
    setInterval(() => {
      // This empty interval prevents Node.js from exiting
      console.error('MCP server heartbeat - keeping connection alive');
    }, 10000); // Send a heartbeat message every 10 seconds
  }
}

export class StdioServerTransport {
  private active = true;
  
  async start(server: McpServer) {
    process.stdin.setEncoding('utf8');
    
    console.error(`MCP Server started and ready for requests`);
    console.error(`Capabilities: ${server.capabilities.join(', ')}`);
    
    // Handle process exit events
    process.on('SIGINT', () => {
      console.error('Received SIGINT signal, shutting down gracefully...');
      this.active = false;
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      console.error('Received SIGTERM signal, shutting down gracefully...');
      this.active = false;
      process.exit(0);
    });
    
    // Add error handlers to prevent crashes
    process.stdin.on('error', (error) => {
      console.error('Error on stdin:', error);
    });
    
    process.stdout.on('error', (error) => {
      console.error('Error on stdout:', error);
    });
    
    let buffer = '';
    
    process.stdin.on('data', async (chunk) => {
      buffer += chunk;
      
      // Try to find complete JSON objects
      let endIndex = 0;
      let startIndex = 0;
      
      while ((startIndex = buffer.indexOf('{', endIndex)) !== -1) {
        let depth = 0;
        let inQuote = false;
        let escapeNext = false;
        
        for (let i = startIndex; i < buffer.length; i++) {
          const char = buffer[i];
          
          if (escapeNext) {
            escapeNext = false;
            continue;
          }
          
          if (char === '\\') {
            escapeNext = true;
            continue;
          }
          
          if (char === '"' && !escapeNext) {
            inQuote = !inQuote;
            continue;
          }
          
          if (inQuote) {
            continue;
          }
          
          if (char === '{') {
            depth++;
          } else if (char === '}') {
            depth--;
            
            if (depth === 0) {
              endIndex = i + 1;
              const jsonString = buffer.substring(startIndex, endIndex);
              
              try {
                const request = JSON.parse(jsonString);
                console.error(`Received request: ${jsonString}`);
                
                const response = await server.handleRequest(request);
                const responseJson = JSON.stringify(response);
                
                console.error(`Sending response: ${responseJson}`);
                process.stdout.write(responseJson + '\n');
              } catch (error) {
                console.error('Error processing request:', error);
                
                const errorResponse: JsonRpcResponse = {
                  jsonrpc: '2.0',
                  id: null,
                  error: {
                    code: -32700,
                    message: 'Parse error',
                    data: error instanceof Error ? error.message : String(error)
                  }
                };
                
                process.stdout.write(JSON.stringify(errorResponse) + '\n');
              }
              
              break;
            }
          }
        }
        
        if (depth !== 0) {
          // Incomplete JSON, wait for more data
          break;
        }
        
        // Remove processed part from buffer
        buffer = buffer.substring(endIndex);
      }
    });
    
    process.stdin.on('end', () => {
      console.error('MCP Server: Input stream ended, but staying alive for reconnection...');
      // Don't exit, allow reconnection
      this.active = false;
    });
  }
}