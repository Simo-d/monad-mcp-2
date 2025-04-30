#!/usr/bin/env node

// A tiny MCP server that handles just the basic required methods
// This script is designed to be as simple as possible to reduce error potential

const fs = require('fs');
const logFile = fs.createWriteStream('/tmp/monad-mcp-log.txt', { flags: 'a' });

function log(message) {
  // Log to both stderr and a file for debugging
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${message}`;
  console.error(logMessage);
  logFile.write(`${logMessage}\n`);
}

log('Monad MCP server starting');

// These are the response templates we will use
const responses = {
  initialize: (id) => ({
    jsonrpc: "2.0",
    id: id,
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
  }),
  
  toolsList: (id) => ({
    jsonrpc: "2.0",
    id: id,
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
  }),
  
  resourcesList: (id) => ({
    jsonrpc: "2.0",
    id: id,
    result: {
      resources: []
    }
  }),
  
  promptsList: (id) => ({
    jsonrpc: "2.0",
    id: id,
    result: {
      prompts: []
    }
  }),
  
  balanceResult: (id, address) => ({
    jsonrpc: "2.0",
    id: id,
    result: {
      content: [
        {
          type: "text",
          text: `Balance for ${address}: 1.0 MON (mock value)`
        }
      ]
    }
  }),
  
  methodNotFound: (id) => ({
    jsonrpc: "2.0",
    id: id,
    error: {
      code: -32601,
      message: "Method not found"
    }
  }),
  
  parseError: () => ({
    jsonrpc: "2.0",
    id: null,
    error: {
      code: -32700,
      message: "Parse error"
    }
  })
};

// Process requests as they come in
process.stdin.on('data', (data) => {
  try {
    const inputStr = data.toString().trim();
    log(`Received: ${inputStr}`);
    
    // Try to parse the input as JSON
    const request = JSON.parse(inputStr);
    
    // Handle different methods
    let response;
    
    if (request.method === 'initialize') {
      response = responses.initialize(request.id);
    }
    else if (request.method === 'tools/list') {
      response = responses.toolsList(request.id);
    }
    else if (request.method === 'resources/list') {
      response = responses.resourcesList(request.id);
    }
    else if (request.method === 'prompts/list') {
      response = responses.promptsList(request.id);
    }
    else if (request.method === 'tools/call' && 
             request.params.name === 'get-mon-balance') {
      response = responses.balanceResult(request.id, request.params.arguments.address);
    }
    else if (request.method === 'notifications/initialized') {
      // No response needed for notifications
      log('Notification received, no response needed');
      return;
    }
    else {
      response = responses.methodNotFound(request.id);
    }
    
    const responseStr = JSON.stringify(response);
    log(`Sending: ${responseStr}`);
    process.stdout.write(responseStr + '\n');
    
  } catch (error) {
    log(`Error processing request: ${error.message}`);
    const response = responses.parseError();
    const responseStr = JSON.stringify(response);
    log(`Sending error: ${responseStr}`);
    process.stdout.write(responseStr + '\n');
  }
});

// Send a startup message to the log file
log('Monad MCP server ready and listening for input');
