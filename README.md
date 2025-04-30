# Monad Testnet MCP Server

This is a custom Model Context Protocol (MCP) server implementation that provides functionality for interacting with the Monad testnet blockchain through Claude.

## Features

- Get MON token balance for a Monad testnet address

## Setup

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

## Using with Claude Desktop

1. Open "Claude Desktop"
2. Open Settings: Claude > Settings > Developer
3. Open `claude_desktop_config.json` (location varies by OS)
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
4. Add details about the MCP server and save the file:

```json
{
  "mcpServers": {
    "monad-testnet": {
      "command": "node",
      "args": [
        "/full/path/to/monad-mcp-2/build/index.js"
      ]
    }
  }
}
```

Replace `/full/path/to` with the actual absolute path to your project directory.

5. Restart "Claude Desktop"

## Usage Example

Once configured, you can ask Claude to check the MON balance of an address:

"What's the MON balance of 0x123...abc?"

You should see a hammer icon that allows you to use the get-mon-balance tool.

## Troubleshooting

- If the hammer icon doesn't appear, check the Claude Desktop logs for error messages
- Make sure the path in the configuration is correct and absolute
- Verify that the server is running by looking for "Monad testnet MCP Server running on stdio" in the logs
