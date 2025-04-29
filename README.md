# Monad MCP Server

This is an MCP (Model Context Protocol) server that allows Claude Desktop to interact with the Monad Testnet blockchain.

## Features

The MCP server provides the following capabilities:

1. **get-mon-balance**: Query the MON token balance for any address on Monad Testnet
2. **get-transaction**: Get details of a transaction on Monad Testnet
3. **get-account-transactions**: Get recent transactions for an address (placeholder implementation)
4. **get-gas-price**: Get current gas price on Monad Testnet
5. **get-contract-events**: Get events emitted by a contract (placeholder implementation)
6. **get-erc20-balance**: Get ERC-20 token balance for an address
7. **get-block-info**: Get information about a specific block
8. **is-contract**: Check if an address is a contract
9. **get-network-stats**: Get current statistics for the Monad Testnet
10. **claim-testnet-tokens**: Get information on how to claim tokens from the Monad Testnet faucet
11. **send-test-tokens**: Send test MON tokens from your own faucet wallet

## Setup Instructions

1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd monad-mcp-2
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure faucet (optional):
   If you want to use the self-hosted faucet functionality, create a `.env` file with:
   ```
   FAUCET_PRIVATE_KEY=your_private_key_without_0x_prefix
   ```
   This allows Claude to send testnet tokens from your own wallet.

4. Build the project:
   ```bash
   npm run build
   ```

5. Configure Claude Desktop:
   - Open Claude Desktop
   - Go to Settings > Developer
   - Open `claude_desktop_config.json`
   - Add the following configuration:
   ```json
   {
     "mcpServers": {
       "monad-mcp-2": {
         "command": "node",
         "args": [
           "/path/to/monad-mcp-2/build/index.js"
         ]
       }
     }
   }
   ```
   - Replace `/path/to/monad-mcp-2` with the absolute path to this directory
   - Save the file and restart Claude Desktop

## Implementation Details

This project includes a custom implementation of the MCP protocol to communicate with Claude Desktop. The implementation follows the JSON-RPC 2.0 specification that Claude Desktop expects:

- All messages are formatted according to the JSON-RPC 2.0 standard
- The server supports the standard JSON-RPC methods including error handling
- Communication occurs via stdin/stdout as expected by Claude Desktop

### Important Limitations

- This MCP server only supports blockchain-related tools and doesn't support filesystem operations
- Claude Desktop may attempt to use filesystem operations, but our server will respond with appropriate error messages
- All file access should be done directly by Claude through its native abilities

## Usage Examples

Here are some examples of how to use this MCP server with Claude Desktop:

### Checking MON Balance
```
Can you check the MON balance for address 0x1234...?
```

### Getting Transaction Details
```
Show me the details for transaction 0xabcd...
```

### Checking Gas Price
```
What's the current gas price on Monad Testnet?
```

### Getting Block Information
```
Tell me about block 12345 on Monad Testnet
```

### Claiming Testnet Tokens
```
I need some test MON tokens. My address is 0x1234...
```

### Checking if an Address is a Contract
```
Is 0x1234... a contract address?
```

### Getting ERC-20 Token Balance
```
Check the balance of the token at 0xTOKEN... for the wallet 0xWALLET...
```

## Development

### Adding New Tools

To add a new tool to the MCP server:

1. Add its name to the `capabilities` array in `src/index.ts`
2. Define the tool using `server.tool()`
3. Rebuild with `npm run build`

### Debugging

If you encounter issues, check the console output for error messages. The server logs detailed information about each request and any errors that occur.

## License

MIT