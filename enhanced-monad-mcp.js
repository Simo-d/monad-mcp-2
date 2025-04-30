#!/usr/bin/env node

// Enhanced Monad Testnet MCP Server with multiple blockchain capabilities
// Allows Claude to perform various operations on Monad testnet

const fs = require('fs');
const { createPublicClient, createWalletClient, http, formatUnits, parseUnits, formatEther } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');

// Set up logging
const logFile = fs.createWriteStream('/tmp/monad-mcp-log.txt', { flags: 'a' });

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${message}`;
  console.error(logMessage);
  logFile.write(`${logMessage}\n`);
}

log('Enhanced Monad MCP server starting');

// Define the Monad testnet chain
const monad = {
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
};

// Create a public client for read operations
const publicClient = createPublicClient({
  chain: monad,
  transport: http('https://rpc.testnet.monad.xyz/json-rpc'),
});

// Default private key for demo purposes (should be properly secured in production)
// This is just a test key with minimal test MON for demonstrations
const DEMO_PRIVATE_KEY = '0x1234567890123456789012345678901234567890123456789012345678901234'; // Replace with your test private key
const account = privateKeyToAccount(DEMO_PRIVATE_KEY);

// Create a wallet client for write operations
const walletClient = createWalletClient({
  account,
  chain: monad,
  transport: http('https://rpc.testnet.monad.xyz/json-rpc'),
});

// Blockchain interaction functions
async function getMonBalance(address) {
  try {
    const balance = await publicClient.getBalance({
      address: address,
    });
    return `Balance for ${address}: ${formatUnits(balance, 18)} MON`;
  } catch (error) {
    log(`Error getting balance: ${error.message}`);
    throw new Error(`Failed to retrieve balance: ${error.message}`);
  }
}

async function getBlockInfo(blockNumberOrTag) {
  try {
    const block = await publicClient.getBlock({
      blockNumber: blockNumberOrTag === 'latest' ? undefined : BigInt(blockNumberOrTag),
    });
    return {
      number: Number(block.number),
      hash: block.hash,
      timestamp: new Date(Number(block.timestamp) * 1000).toISOString(),
      transactions: block.transactions.length,
      gasUsed: formatUnits(block.gasUsed, 9) + ' gwei',
      miner: block.miner
    };
  } catch (error) {
    log(`Error getting block info: ${error.message}`);
    throw new Error(`Failed to retrieve block info: ${error.message}`);
  }
}

async function getTransactionInfo(txHash) {
  try {
    const tx = await publicClient.getTransaction({
      hash: txHash,
    });
    return {
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: formatEther(tx.value) + ' MON',
      blockNumber: Number(tx.blockNumber),
      gasPrice: formatUnits(tx.gasPrice, 9) + ' gwei',
      status: tx.status === 1 ? 'Success' : 'Failed'
    };
  } catch (error) {
    log(`Error getting transaction info: ${error.message}`);
    throw new Error(`Failed to retrieve transaction info: ${error.message}`);
  }
}

async function sendTransaction(toAddress, amount) {
  try {
    // Convert amount to wei
    const value = parseUnits(amount, 18);
    
    // Send transaction
    const hash = await walletClient.sendTransaction({
      to: toAddress,
      value: value
    });
    
    return {
      hash: hash,
      from: account.address,
      to: toAddress,
      value: amount + ' MON',
      status: 'Pending'
    };
  } catch (error) {
    log(`Error sending transaction: ${error.message}`);
    throw new Error(`Failed to send transaction: ${error.message}`);
  }
}

async function getNetworkInfo() {
  try {
    const chainId = await publicClient.getChainId();
    const blockNumber = await publicClient.getBlockNumber();
    const gasPrice = await publicClient.getGasPrice();
    
    return {
      name: 'Monad Testnet',
      chainId: Number(chainId),
      currentBlock: Number(blockNumber),
      gasPrice: formatUnits(gasPrice, 9) + ' gwei',
      currency: 'MON'
    };
  } catch (error) {
    log(`Error getting network info: ${error.message}`);
    throw new Error(`Failed to retrieve network info: ${error.message}`);
  }
}

async function estimateGas(toAddress, amount) {
  try {
    const value = parseUnits(amount, 18);
    
    const gasEstimate = await publicClient.estimateGas({
      account: account.address,
      to: toAddress,
      value: value
    });
    
    return `Estimated gas cost: ${formatUnits(gasEstimate, 9)} gwei`;
  } catch (error) {
    log(`Error estimating gas: ${error.message}`);
    throw new Error(`Failed to estimate gas: ${error.message}`);
  }
}

// These are the response templates for various MCP methods
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
        version: "0.1.0"
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
        },
        {
          name: "get-block-info",
          description: "Get information about a specific block on Monad testnet",
          inputSchema: {
            type: "object",
            properties: {
              blockNumber: {
                type: "string",
                description: "Block number or 'latest' for the most recent block"
              }
            },
            required: ["blockNumber"],
            additionalProperties: false
          }
        },
        {
          name: "get-transaction-info",
          description: "Get details about a specific transaction on Monad testnet",
          inputSchema: {
            type: "object",
            properties: {
              txHash: {
                type: "string",
                description: "Transaction hash to look up"
              }
            },
            required: ["txHash"],
            additionalProperties: false
          }
        },
        {
          name: "send-transaction",
          description: "Send MON from the test wallet to a specified address",
          inputSchema: {
            type: "object",
            properties: {
              toAddress: {
                type: "string",
                description: "Recipient address to send MON to"
              },
              amount: {
                type: "string",
                description: "Amount of MON to send (e.g., '0.01')"
              }
            },
            required: ["toAddress", "amount"],
            additionalProperties: false
          }
        },
        {
          name: "get-network-info",
          description: "Get general information about the Monad testnet",
          inputSchema: {
            type: "object",
            properties: {},
            additionalProperties: false
          }
        },
        {
          name: "estimate-gas",
          description: "Estimate the gas cost for a transaction",
          inputSchema: {
            type: "object",
            properties: {
              toAddress: {
                type: "string",
                description: "Recipient address for the transaction"
              },
              amount: {
                type: "string",
                description: "Amount of MON to send (e.g., '0.01')"
              }
            },
            required: ["toAddress", "amount"],
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
  
  // Format a successful response with content
  successResponse: (id, text) => ({
    jsonrpc: "2.0",
    id: id,
    result: {
      content: [
        {
          type: "text",
          text: typeof text === 'string' ? text : JSON.stringify(text, null, 2)
        }
      ]
    }
  }),
  
  // Format an error response
  errorResponse: (id, message) => ({
    jsonrpc: "2.0",
    id: id,
    error: {
      code: -32000,
      message: message
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
process.stdin.on('data', async (data) => {
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
    else if (request.method === 'tools/call') {
      // Handle the various tool calls
      const toolName = request.params.name;
      const args = request.params.arguments;
      
      try {
        if (toolName === 'get-mon-balance') {
          const result = await getMonBalance(args.address);
          response = responses.successResponse(request.id, result);
        }
        else if (toolName === 'get-block-info') {
          const result = await getBlockInfo(args.blockNumber);
          response = responses.successResponse(request.id, result);
        }
        else if (toolName === 'get-transaction-info') {
          const result = await getTransactionInfo(args.txHash);
          response = responses.successResponse(request.id, result);
        }
        else if (toolName === 'send-transaction') {
          const result = await sendTransaction(args.toAddress, args.amount);
          response = responses.successResponse(request.id, result);
        }
        else if (toolName === 'get-network-info') {
          const result = await getNetworkInfo();
          response = responses.successResponse(request.id, result);
        }
        else if (toolName === 'estimate-gas') {
          const result = await estimateGas(args.toAddress, args.amount);
          response = responses.successResponse(request.id, result);
        }
        else {
          response = responses.errorResponse(request.id, `Unknown tool: ${toolName}`);
        }
      } catch (error) {
        response = responses.errorResponse(request.id, error.message);
      }
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
log('Enhanced Monad MCP server ready and listening for input');
