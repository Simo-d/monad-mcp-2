const http = require('http');
const { formatUnits } = require('viem');

// Simple mock response for balance
function getMonBalance(address) {
  // This is a mock - in a real implementation, you would use viem to query the blockchain
  const mockBalance = BigInt("1000000000000000000"); // 1 MON
  return `Balance for ${address}: ${formatUnits(mockBalance, 18)} MON`;
}

// Create a simple HTTP server
const server = http.createServer((req, res) => {
  console.log(`Received request: ${req.method} ${req.url}`);
  
  // Set CORS headers to allow requests from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS requests (preflight)
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // Handle POST requests with JSON
  if (req.method === 'POST') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        console.log(`Received body: ${body}`);
        const jsonRequest = JSON.parse(body);
        
        // Handle initialize
        if (jsonRequest.method === 'initialize') {
          const response = {
            jsonrpc: "2.0",
            id: jsonRequest.id,
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
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(response));
          console.log(`Sent response: ${JSON.stringify(response)}`);
        }
        // Handle tools/list
        else if (jsonRequest.method === 'tools/list') {
          const response = {
            jsonrpc: "2.0",
            id: jsonRequest.id,
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
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(response));
          console.log(`Sent response: ${JSON.stringify(response)}`);
        }
        // Handle tools/call
        else if (jsonRequest.method === 'tools/call') {
          const { name, arguments: args } = jsonRequest.params;
          
          if (name === 'get-mon-balance') {
            const balance = getMonBalance(args.address);
            
            const response = {
              jsonrpc: "2.0",
              id: jsonRequest.id,
              result: {
                content: [
                  {
                    type: "text",
                    text: balance
                  }
                ]
              }
            };
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response));
            console.log(`Sent response: ${JSON.stringify(response)}`);
          } else {
            const response = {
              jsonrpc: "2.0",
              id: jsonRequest.id,
              error: {
                code: -32000,
                message: `Unknown tool: ${name}`
              }
            };
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response));
            console.log(`Sent error response: ${JSON.stringify(response)}`);
          }
        }
        // Handle resources/list
        else if (jsonRequest.method === 'resources/list') {
          const response = {
            jsonrpc: "2.0",
            id: jsonRequest.id,
            result: {
              resources: []
            }
          };
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(response));
          console.log(`Sent response: ${JSON.stringify(response)}`);
        }
        // Handle prompts/list
        else if (jsonRequest.method === 'prompts/list') {
          const response = {
            jsonrpc: "2.0",
            id: jsonRequest.id,
            result: {
              prompts: []
            }
          };
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(response));
          console.log(`Sent response: ${JSON.stringify(response)}`);
        }
        // Handle unknown methods
        else {
          const response = {
            jsonrpc: "2.0",
            id: jsonRequest.id,
            error: {
              code: -32601,
              message: "Method not found"
            }
          };
          
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(response));
          console.log(`Sent method not found response: ${JSON.stringify(response)}`);
        }
      } catch (error) {
        console.error('Error processing request:', error);
        
        const response = {
          jsonrpc: "2.0",
          id: null,
          error: {
            code: -32700,
            message: "Parse error"
          }
        };
        
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
        console.log(`Sent parse error response: ${JSON.stringify(response)}`);
      }
    });
  }
  // Handle GET for health check
  else if (req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', message: 'Monad MCP HTTP Server is running' }));
  } 
  // Handle other methods
  else {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
  }
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Monad MCP HTTP Server running at http://localhost:${PORT}/`);
});
