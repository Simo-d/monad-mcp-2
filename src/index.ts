import { createPublicClient, formatUnits, http, defineChain } from 'viem';

// Define the Monad testnet chain
const monad = defineChain({
  id: 1337,
  name: 'Monad Testnet',
  network: 'monad-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MON',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.monad.xyz/json-rpc'],
    },
    public: {
      http: ['https://rpc.testnet.monad.xyz/json-rpc'],
    },
  },
});

// Create a public client to interact with the Monad testnet
const publicClient = createPublicClient({
  chain: monad,
  transport: http('https://rpc.testnet.monad.xyz/json-rpc'),
});

// Basic JSON-RPC server implementation
async function main() {
  const stdin = process.stdin;
  const stdout = process.stdout;

  stdin.setEncoding('utf-8');
  
  console.error('Monad testnet MCP Server starting...');
  
  // Send initialize response immediately to fix connection issues
  // This is the primary issue - we need to respond to the initialize message immediately
  const initResponse = {
    jsonrpc: "2.0",
    id: 0,
    result: {
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: {}
      },
      serverInfo: {
        name: "monad-testnet-server",
        version: "0.0.1"
      }
    }
  };

  // Send it immediately on startup
  stdout.write(JSON.stringify(initResponse) + '\n');
  console.error('Sent initial response:', JSON.stringify(initResponse));
  
  // Process additional requests
  stdin.on('data', (data) => {
    console.error('Received data:', data.toString().trim());
    
    try {
      const request = JSON.parse(data.toString());
      console.error('Parsed request:', JSON.stringify(request));
      
      if (request.method === 'initialize') {
        // We already sent the response, do nothing
        console.error('Ignoring duplicate initialize request');
      } 
      else if (request.method === 'notifications/initialized') {
        // No response needed
        console.error('Received notifications/initialized, no response needed');
      }
      else if (request.method === 'tools/list') {
        const response = {
          jsonrpc: "2.0",
          id: request.id,
          result: {
            tools: [
              {
                name: "get-mon-balance",
                description: "Get MON balance for an address on Monad testnet",
                inputSchema: {
                  type: "object",
                  properties: {
                    address: {
                      type: "string",
                      description: "Monad testnet address to check balance for"
                    }
                  },
                  required: ["address"],
                  additionalProperties: false
                }
              }
            ]
          }
        };
        
        stdout.write(JSON.stringify(response) + '\n');
        console.error('Sent tools/list response:', JSON.stringify(response));
      }
      else if (request.method === 'tools/call') {
        handleToolCall(request, stdout);
      }
      else if (request.method === 'resources/list') {
        const response = {
          jsonrpc: "2.0",
          id: request.id,
          result: {
            resources: []
          }
        };
        
        stdout.write(JSON.stringify(response) + '\n');
        console.error('Sent resources/list response:', JSON.stringify(response));
      }
      else if (request.method === 'prompts/list') {
        const response = {
          jsonrpc: "2.0",
          id: request.id,
          result: {
            prompts: []
          }
        };
        
        stdout.write(JSON.stringify(response) + '\n');
        console.error('Sent prompts/list response:', JSON.stringify(response));
      }
      else {
        // Method not found
        const response = {
          jsonrpc: "2.0",
          id: request.id,
          error: {
            code: -32601,
            message: "Method not found"
          }
        };
        
        stdout.write(JSON.stringify(response) + '\n');
        console.error('Sent method not found response:', JSON.stringify(response));
      }
    } catch (error) {
      console.error('Error processing request:', error);
      // Parse error
      const response = {
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32700,
          message: "Parse error"
        }
      };
      
      stdout.write(JSON.stringify(response) + '\n');
      console.error('Sent parse error response:', JSON.stringify(response));
    }
  });
  
  // Handle tool calls
  async function handleToolCall(request: any, stdout: NodeJS.WriteStream) {
    const { name, arguments: args } = request.params;
    
    if (name !== 'get-mon-balance') {
      const response = {
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: -32000,
          message: `Unknown tool: ${name}`
        }
      };
      
      stdout.write(JSON.stringify(response) + '\n');
      console.error('Sent unknown tool response:', JSON.stringify(response));
      return;
    }
    
    try {
      const balance = await publicClient.getBalance({
        address: args.address as `0x${string}`,
      });
      
      const response = {
        jsonrpc: "2.0",
        id: request.id,
        result: {
          content: [
            {
              type: "text",
              text: `Balance for ${args.address}: ${formatUnits(balance, 18)} MON`
            }
          ]
        }
      };
      
      stdout.write(JSON.stringify(response) + '\n');
      console.error('Sent successful balance response:', JSON.stringify(response));
    } catch (error) {
      const response = {
        jsonrpc: "2.0",
        id: request.id,
        error: {
          code: -32000,
          message: `Failed to retrieve balance: ${error instanceof Error ? error.message : String(error)}`
        }
      };
      
      stdout.write(JSON.stringify(response) + '\n');
      console.error('Sent error response:', JSON.stringify(response));
    }
  }
  
  console.error('Monad testnet MCP Server running on JSON-RPC over stdio');
}

// Start the server
if (require.main === module) {
  main().catch((error) => {
    console.error('Error starting MCP server:', error);
    process.exit(1);
  });
}
