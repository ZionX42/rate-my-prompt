# Appwrite MCP Integration Guide

This project now includes a local Model Context Protocol (MCP) server that surfaces Appwrite data to MCP-aware clients such as the VS Code MCP extension. Use this guide to configure the integration end-to-end.

## 1. Prerequisites

- Node.js 18 or newer (required by both the MCP SDK and Appwrite SDK)
- A running Appwrite instance with:
  - API endpoint URL (e.g. `https://cloud.appwrite.io/v1`)
  - Project ID
  - API key with database access
  - Database ID containing the collections you want to explore
- The VS Code _Model Context Protocol (MCP) Client_ extension installed and enabled

## 2. Environment configuration

1. Copy `.env.example` to `.env.local` if you have not already.
2. Populate the Appwrite entries:
   - `APPWRITE_ENDPOINT`
   - `APPWRITE_PROJECT_ID`
   - `APPWRITE_API_KEY`
   - `APPWRITE_DATABASE_ID`
3. Restart VS Code or reload the environment so the MCP server can pick up the new values.

The MCP server loads `.env.local` automatically (and falls back to `.env`), so you do not need to duplicate the variables elsewhere.

## 3. Install dependencies

From the repository root run:

```powershell
npm install
```

This installs the MCP SDK alongside existing project packages.

## 4. Available npm script

A convenience script starts the Appwrite MCP server in stdio mode:

```powershell
npm run mcp:appwrite
```

The process stays attached to the terminal waiting for MCP client messages. Stop it with <kbd>Ctrl</kbd> + <kbd>C</kbd> when you are done.

## 5. MCP client configuration in VS Code

1. Open the Command Palette and run **“MCP: Open Configuration File”** (or the equivalent option provided by your MCP client extension).
2. Point the configuration to the repository’s `mcp.config.json`. The relevant section is:

   ```json
   {
     "servers": {
       "appwrite": {
         "command": "npm",
         "args": ["run", "mcp:appwrite"],
         "cwd": "."
       }
     }
   }
   ```

3. Save the configuration and reload the MCP extension if prompted. The client will start the script with the repository root as the working directory, so `.env.local` is automatically respected.

## 6. Using the Appwrite MCP server

Once the MCP client connects, the following tools and resources become available:

- **Tools**
  - `list_collections(databaseId?)` – lists Appwrite collections in the given (or default) database
  - `list_documents(collectionId, databaseId?, limit?)` – enumerates documents for a collection
  - `get_document(collectionId, documentId, databaseId?)` – fetches a single document as formatted JSON
- **Resource template**
  - `appwrite://database/{databaseId}/collection/{collectionId}/document/{documentId}` – resolves to the JSON representation of a document

### Example workflow

1. From the MCP client UI, run the `list_collections` tool to discover collection identifiers.
2. Use `list_documents` with one of those IDs to inspect individual records.
3. Fetch a specific document through either the `get_document` tool or by requesting the resource URI.

If you need to query additional Appwrite services, extend `mcp/servers/appwrite/server.ts` with new tools using the same pattern.

## 7. Troubleshooting

- **“Missing Appwrite credentials”** – ensure all required `APPWRITE_` values are populated in `.env.local`.
- **Process exits immediately** – double-check the Node.js version (`node -v`) is 18 or newer.
- **MCP client reports connection errors** – restart VS Code, verify the MCP config path, and confirm no other process is bound to the stdio transport.

With this setup you can explore Appwrite data directly from MCP-aware tools without modifying the existing application runtime.
