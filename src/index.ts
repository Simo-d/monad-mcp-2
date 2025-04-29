import { McpServer, StdioServerTransport } from "./mcp/server";
import { 
  createPublicClient, 
  createWalletClient,
  http, 
  formatUnits, 
  parseUnits 
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { monadTestnet } from "./chains/monad";
import { z } from "zod";
// @ts-ignore
import fetch from 'node-fetch';
// Load environment variables
import * as dotenv from "dotenv";
dotenv.config();

// Set up the Monad testnet public client using viem
const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http("https://rpc.testnet.monad.xyz/"),
});

// Get the faucet private key from environment variables
const FAUCET_PRIVATE_KEY = process.env.FAUCET_PRIVATE_KEY;
// Set up the wallet client if private key is available
let walletClient: any = null;
if (FAUCET_PRIVATE_KEY) {
  try {
    const account = privateKeyToAccount(`0x${FAUCET_PRIVATE_KEY}`);
    walletClient = createWalletClient({
      account,
      chain: monadTestnet,
      transport: http("https://rpc.testnet.monad.xyz/"),
    });
    console.log("Faucet wallet configured successfully");
  } catch (error) {
    console.error("Failed to configure faucet wallet:", error);
  }
}

// Create a new MCP server instance with all capabilities
const server = new McpServer({
  name: "monad-mcp-2",
  version: "0.0.1",
  capabilities: [
    "get-mon-balance",
    "get-transaction",
    "get-gas-price",
    "get-block-info",
    "is-contract",
    "get-network-stats",
    "get-erc20-balance",
    "get-contract-events",
    "get-account-transactions",
    "claim-testnet-tokens",
    "send-test-tokens"
  ]
});

// Initialize logging for debugging
console.error('Starting Monad MCP server with capabilities:', server.capabilities);

// 1. Get MON Balance Tool
server.tool(
  "get-mon-balance",
  "Get MON balance for an address on Monad testnet",
  {
    address: z.string().describe("Monad testnet address to check balance for"),
  },
  async ({ address }) => {
    try {
      const balance = await publicClient.getBalance({
        address: address as `0x${string}`,
      });

      return {
        content: [
          {
            type: "text",
            text: `Balance for ${address}: ${formatUnits(balance, 18)} MON`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to retrieve balance for address: ${address}. Error: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
      };
    }
  }
);

// 2. Get Transaction Details Tool
server.tool(
  "get-transaction",
  "Get details of a transaction on Monad testnet",
  {
    txHash: z.string().describe("Transaction hash to look up"),
  },
  async ({ txHash }) => {
    try {
      const transaction = await publicClient.getTransaction({
        hash: txHash as `0x${string}`,
      });
      
      return {
        content: [
          {
            type: "text",
            text: `Transaction Details:
- Hash: ${transaction.hash}
- From: ${transaction.from}
- To: ${transaction.to || "Contract Creation"}
- Value: ${formatUnits(transaction.value, 18)} MON
- Block Number: ${transaction.blockNumber}
- Gas Used: ${transaction.gas.toString()}
- Status: ${transaction.blockNumber ? "Confirmed" : "Pending"}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to retrieve transaction: ${txHash}. Error: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
      };
    }
  }
);

// 3. Get Account Transactions Tool
server.tool(
  "get-account-transactions",
  "Get recent transactions for an address on Monad testnet",
  {
    address: z.string().describe("Monad testnet address to check transactions for"),
    limit: z.number().optional().describe("Maximum number of transactions to return (default: 5)"),
  },
  async ({ address, limit = 5 }) => {
    try {
      // This would require connecting to a block explorer API or indexer
      // For now, we'll simulate the response
      return {
        content: [
          {
            type: "text",
            text: `Note: This is a placeholder implementation. You would need to integrate with a block explorer API to get real transaction history.
            
For address ${address}, would fetch the last ${limit} transactions.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to retrieve transactions for address: ${address}. Error: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
      };
    }
  }
);

// 4. Get Gas Price Tool
server.tool(
  "get-gas-price",
  "Get current gas price on Monad testnet",
  {},
  async () => {
    try {
      const gasPrice = await publicClient.getGasPrice();
      
      return {
        content: [
          {
            type: "text",
            text: `Current gas price: ${formatUnits(gasPrice, 9)} Gwei`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to retrieve gas price. Error: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
      };
    }
  }
);

// 5. Get Contract Events Tool
server.tool(
  "get-contract-events",
  "Get events emitted by a contract on Monad testnet",
  {
    contractAddress: z.string().describe("Address of the contract"),
    eventName: z.string().optional().describe("Name of the event to filter for"),
    fromBlock: z.number().optional().describe("Start block number (defaults to 100 blocks back)"),
    toBlock: z.number().optional().describe("End block number (defaults to latest)"),
  },
  async ({ contractAddress, eventName, fromBlock, toBlock }) => {
    try {
      // You would need the ABI for the specific contract to do this properly
      // This is just a placeholder implementation
      return {
        content: [
          {
            type: "text",
            text: `Note: This requires the contract ABI to implement fully.
            
Would fetch events for contract ${contractAddress}${eventName ? ` of type ${eventName}` : ''} 
from block ${fromBlock || '(recent)'} to ${toBlock || 'latest'}.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to retrieve events for contract: ${contractAddress}. Error: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
      };
    }
  }
);

// 6. Get ERC-20 Token Balance Tool
server.tool(
  "get-erc20-balance",
  "Get ERC-20 token balance for an address on Monad testnet",
  {
    tokenAddress: z.string().describe("Contract address of the ERC-20 token"),
    walletAddress: z.string().describe("Wallet address to check balance for"),
  },
  async ({ tokenAddress, walletAddress }) => {
    try {
      // ERC-20 balanceOf function signature
      const balanceOfData = '0x70a08231' + 
        walletAddress.slice(2).padStart(64, '0');
        
      const result = await publicClient.call({
        to: tokenAddress as `0x${string}`,
        data: balanceOfData as `0x${string}`,
      });
      
      // Convert the result to a string first to ensure compatibility with BigInt
      const resultStr = result?.toString() || '0';
      
      // Parse the result to a decimal number
      const balance = BigInt(resultStr);
      
      // We'd need to query decimals() to format properly, but we'll use 18 as default
      return {
        content: [
          {
            type: "text",
            text: `Token balance for ${walletAddress} of token at ${tokenAddress}: ${formatUnits(balance, 18)} tokens`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to retrieve token balance. Error: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
      };
    }
  }
);

// 7. Get Block Information Tool
server.tool(
  "get-block-info",
  "Get information about a specific block on Monad testnet",
  {
    blockNumber: z.number().optional().describe("Block number to query (defaults to latest)"),
  },
  async ({ blockNumber }) => {
    try {
      const block = await publicClient.getBlock({
        blockNumber: blockNumber ? BigInt(blockNumber) : undefined,
      });
      
      return {
        content: [
          {
            type: "text",
            text: `Block Information:
- Number: ${block.number}
- Hash: ${block.hash}
- Timestamp: ${new Date(Number(block.timestamp) * 1000).toISOString()}
- Parent Hash: ${block.parentHash}
- Transaction Count: ${block.transactions.length}
- Gas Used: ${block.gasUsed.toString()}
- Gas Limit: ${block.gasLimit.toString()}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to retrieve block information. Error: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
      };
    }
  }
);

// 8. Check If Address Is Contract Tool
server.tool(
  "is-contract",
  "Check if an address is a contract on Monad testnet",
  {
    address: z.string().describe("Monad testnet address to check"),
  },
  async ({ address }) => {
    try {
      const code = await publicClient.getBytecode({
        address: address as `0x${string}`,
      });
      
      const isContract = code && code !== '0x';
      
      return {
        content: [
          {
            type: "text",
            text: `Address ${address} is ${isContract ? 'a contract' : 'not a contract'} (${isContract ? 'has code' : 'no code detected'})`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to check if address is a contract. Error: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
      };
    }
  }
);

// 9. Get Network Stats Tool
server.tool(
  "get-network-stats",
  "Get current statistics for the Monad testnet",
  {},
  async () => {
    try {
      const latestBlock = await publicClient.getBlock();
      const gasPrice = await publicClient.getGasPrice();
      
      return {
        content: [
          {
            type: "text",
            text: `Monad Testnet Statistics:
- Latest Block: ${latestBlock.number}
- Latest Block Time: ${new Date(Number(latestBlock.timestamp) * 1000).toISOString()}
- Gas Price: ${formatUnits(gasPrice, 9)} Gwei
- Chain ID: ${monadTestnet.id}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to retrieve network statistics. Error: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
      };
    }
  }
);

// Helper function to attempt to claim from the faucet API
async function claimFromFaucet(address: string) {
  try {
    // This is an example API endpoint - the actual endpoint may differ
    const response = await fetch('https://faucet.testnet.monad.xyz/api/claim', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ address }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Faucet request failed: ${error}`);
    }
    
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

// 10. Claim Testnet Tokens Tool
server.tool(
  "claim-testnet-tokens",
  "Request tokens from the Monad testnet faucet for an address",
  {
    address: z.string().describe("Monad testnet address to receive tokens"),
  },
  async ({ address }) => {
    try {
      // First, try to call the API
      const result = await claimFromFaucet(address);
      
      if (result.success) {
        return {
          content: [
            {
              type: "text",
              text: `Successfully requested tokens from the Monad testnet faucet for address ${address}.
${result.data.txHash ? `Transaction hash: ${result.data.txHash}` : ''}
${result.data.amount ? `Amount: ${result.data.amount} MON` : 'Tokens are being sent to your wallet.'}

The tokens should arrive in your wallet shortly.`,
            },
          ],
        };
      } else {
        // API call failed, provide manual instructions as fallback
        return {
          content: [
            {
              type: "text",
              text: `I couldn't automatically claim tokens for you (${result.error}).

To claim testnet tokens manually, please visit:
https://faucet.testnet.monad.xyz/

And enter your address: ${address}

The faucet website will process your request and send tokens to your wallet.`,
            },
          ],
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to claim tokens. Error: ${error instanceof Error ? error.message : String(error)}

Please try claiming tokens manually at https://faucet.testnet.monad.xyz/`,
          },
        ],
      };
    }
  }
);

// 11. Send Test Tokens Tool (via self-hosted faucet)
server.tool(
  "send-test-tokens",
  "Send test MON tokens from your own faucet wallet to an address",
  {
    address: z.string().describe("Monad testnet address to receive tokens"),
    amount: z.string().optional().describe("Amount of MON to send (default: 0.1)"),
  },
  async ({ address, amount = "0.1" }) => {
    try {
      // Check if the faucet is configured
      if (!walletClient) {
        return {
          content: [
            {
              type: "text",
              text: `Faucet not configured. Please add FAUCET_PRIVATE_KEY to your .env file.`,
            },
          ],
        };
      }
      
      // Send the transaction
      const hash = await walletClient.sendTransaction({
        to: address as `0x${string}`,
        value: parseUnits(amount, 18),
      });
      
      return {
        content: [
          {
            type: "text",
            text: `Successfully sent ${amount} MON to ${address}.
Transaction hash: ${hash}
The tokens should arrive in the wallet shortly.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Failed to send test tokens. Error: ${
              error instanceof Error ? error.message : String(error)
            }
            
This could be due to:
- Insufficient funds in the faucet wallet
- Network connectivity issues
- Invalid recipient address`,
          },
        ],
      };
    }
  }
);

async function main() {
  try {
    // Create a transport layer using standard input/output
    const transport = new StdioServerTransport();
    
    // Connect the server to the transport
    await server.connect(transport);
  } catch (error) {
    console.error('Error in main function:', error);
    // Don't exit the process, try to keep it alive
    setInterval(() => {
      console.error('Server encountered an error but staying alive for reconnection...');
    }, 10000);
  }
}

// Add global error handlers
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  // Don't exit
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled promise rejection:', reason);
  // Don't exit
});

// Start the server with auto-restart capability
function startServer() {
  main().catch((error) => {
    console.error("Failed to start MCP server:", error);
    // Wait a bit and try to restart
    setTimeout(() => {
      console.error("Attempting to restart the server...");
      startServer();
    }, 5000);
  });
}

startServer();
