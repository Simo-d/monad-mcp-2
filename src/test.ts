/**
 * Simple test script for the Monad MCP server
 * 
 * This script simulates Claude Desktop calling our MCP server
 * It sends a few test requests and prints the responses
 */

// Create a child process to run the MCP server
const { spawn } = require('child_process');
const path = require('path');

// Start the MCP server as a child process
const server = spawn('node', [path.join(__dirname, 'index.js')], {
  stdio: ['pipe', 'pipe', process.stderr]
});

// Define types for our test script using JSON-RPC 2.0 format
type JsonRpcRequest = {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: any;
};

type JsonRpcResponse = {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
};

// Helper function to send a request to the MCP server and get a response
async function sendRequest(request: JsonRpcRequest): Promise<JsonRpcResponse> {
  return new Promise((resolve, reject) => {
    const jsonRequest = JSON.stringify(request);
    console.log(`Sending request: ${jsonRequest}`);
    
    // Send the request to the server
    server.stdin.write(jsonRequest + '\n');
    
    // Listen for the response
    const onData = (data: Buffer) => {
      const responseStr = data.toString();
      console.log(`Received response: ${responseStr}`);
      
      try {
        const response = JSON.parse(responseStr);
        resolve(response);
        server.stdout.removeListener('data', onData);
      } catch (error) {
        // Not a valid JSON, might be partial data
        console.log('Received partial data, waiting for more...');
      }
    };
    
    server.stdout.on('data', onData);
  });
}

// Run the tests
async function runTests() {
  try {
    // Test 1: Ping the server
    const pingResponse = await sendRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'ping'
    });
    console.log('Ping response:', pingResponse);
    
    // Wait a bit before sending next request
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Test 2: Call the get-mon-balance tool
    const balanceResponse = await sendRequest({
      jsonrpc: '2.0',
      id: 2,
      method: 'toolCall',
      params: {
        id: 'get-mon-balance',
        params: {
          address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
        }
      }
    });
    console.log('Balance response:', balanceResponse);
    
    // Wait a bit before sending next request
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Test 3: Call the get-gas-price tool
    const gasPriceResponse = await sendRequest({
      jsonrpc: '2.0',
      id: 3,
      method: 'toolCall',
      params: {
        id: 'get-gas-price',
        params: {}
      }
    });
    console.log('Gas price response:', gasPriceResponse);
    
    // Wait a bit before sending next request
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Test 4: Call the get-network-stats tool
    const networkStatsResponse = await sendRequest({
      jsonrpc: '2.0',
      id: 4,
      method: 'toolCall',
      params: {
        id: 'get-network-stats',
        params: {}
      }
    });
    console.log('Network stats response:', networkStatsResponse);
    
    // Clean up
    console.log('Tests completed successfully!');
    // Don't end stdin yet, let the server keep running
    // server.stdin.end();
    
    // Simulate the full protocol flow, including initialize
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('\nTesting Claude Desktop protocol flow...');
    const initResponse = await sendRequest({
      jsonrpc: '2.0',
      id: 5,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'test-client',
          version: '0.1.0'
        }
      }
    });
    console.log('Initialize response:', initResponse);
    
    // Wait a bit to allow observation of the server behavior
    console.log('\nServer will continue running. Press Ctrl+C to exit.');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the tests
runTests();
