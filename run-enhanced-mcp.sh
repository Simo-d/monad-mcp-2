#!/bin/bash

# Make the server script executable
chmod +x ./enhanced-monad-mcp.js

# Install required dependencies if they don't exist
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install viem
fi

# Run the enhanced MCP server
./enhanced-monad-mcp.js
