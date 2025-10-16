# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a pnpm monorepo workspace for an AI companion network system with two main applications:

- **aikyo**: Server application that manages AI companion agents with WebSocket communication
- **yukkuri**: Client application that connects to aikyo's WebSocket server to receive messages

The system allows multiple AI companions (agents with distinct personalities) to communicate with each other and users through a publish-subscribe architecture using the `@aikyo/*` family of packages.

## Development Commands

### Installation
```bash
pnpm i
```

### Running Applications
```bash
# Run the server (aikyo app on port 5000 for companions, 8080 for firehose)
pnpm run server

# Run the client (yukkuri app, connects to ws://localhost:8080)
pnpm run client
```

### Linting and Formatting
```bash
# Check code with Biome
pnpm run check

# Check and auto-fix issues
pnpm run check:fix
```

### Running Individual Apps
```bash
# Run aikyo directly
cd apps/aikyo
pnpm run start

# Run aikyo with debug logging
pnpm run start:debug
```

## Architecture

### Core Components

1. **Companion Agents** (`apps/aikyo/src/cards/`)
   - Each companion is defined by a `CompanionCard` with:
     - `metadata`: id, name, personality, story, sample dialog
     - `role`: system role description
     - `actions`: tools the companion can execute (e.g., `speakTool`)
     - `knowledge`: information sources (e.g., `companionNetworkKnowledge`)
     - `events`: conditional logic with parameters and execution rules
   - Companions use Anthropic Claude models via the `@ai-sdk/anthropic` package
   - Examples: `kyoko.ts`, `aya.ts` - each has personality and conversational behavior

2. **Server Architecture** (`apps/aikyo/src/index.ts`)
   - **CompanionServer** (port 5000): Manages companion agent lifecycle and interactions
   - **FirehoseServer** (port 8080): WebSocket pub-sub server that broadcasts messages to clients
   - The firehose connects to `ws://localhost:8000` for upstream queries

3. **Communication Flow**
   - Companions use `actions` (tools) to publish messages/queries to topics
   - FirehoseServer subscribes to topics: `"queries"`, `"messages"`, `"states"`
   - Messages are validated with Zod schemas (`MessageSchema`, `StateSchema`, `QueryResultSchema`)
   - Clients connect to FirehoseServer via WebSocket to receive real-time updates

4. **Tools and Actions** (`apps/aikyo/src/tools/core/index.ts`)
   - `speakTool`: Allows companions to send messages to other companions/users
     - Publishes to `"messages"` topic
     - Sends upstream query via `sendQuery`
   - `companionNetworkKnowledge`: Provides companions with list of other companions in network

### Key Types and Schemas

- `CompanionCard`: Defines agent configuration (personality, tools, knowledge, events)
- `Message`: Message format in conversation history
- `Query`: JSON-RPC 2.0 query structure for companion actions
- `Companion`: Tuple of agent instance and message history

### Package Manager

- Uses **pnpm** with workspace configuration (`pnpm-workspace.yaml`)
- Shared dependencies managed via catalog in `pnpm-workspace.yaml`
- Common catalog packages: `zod`, `ws`, `@types/ws`, `tsx`, `@aikyo/*` family

## Code Style

- Uses **Biome** for linting and formatting
- 2-space indentation
- Double quotes for strings
- Auto-organize imports enabled
