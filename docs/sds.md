# Software Design Specification (SDS)

> Minecraft AI Companion — Version 1.0  
> Status: **FROZEN** — Changes require protocol version bump.

This document is the **single source of truth** for all technical contracts in the Minecraft AI Companion project. All implementation must conform to this specification.

---

# 1. Monorepo Structure

```
companion_mod_mc/
├── backend/                        # AI Backend (Node.js / TypeScript)
│   ├── src/
│   │   ├── index.ts                # Entry point — bootstraps all modules
│   │   ├── config/
│   │   │   ├── index.ts            # Config loader
│   │   │   ├── schema.ts           # Zod validation schema
│   │   │   └── defaults.ts         # Default values
│   │   ├── websocket/
│   │   │   ├── server.ts           # WebSocket server
│   │   │   ├── handler.ts          # Message routing
│   │   │   └── connection.ts       # Connection state management
│   │   ├── bus/
│   │   │   ├── index.ts            # EventBus class
│   │   │   └── events.ts           # Event type definitions
│   │   ├── blackboard/
│   │   │   ├── index.ts            # Blackboard class
│   │   │   ├── entries.ts          # Entry type definitions
│   │   │   └── defaults.ts         # Default values
│   │   ├── modules/
│   │   │   ├── conversation/       # Conversation manager
│   │   │   │   ├── index.ts
│   │   │   │   ├── context-builder.ts  # Prompt assembly
│   │   │   │   ├── history.ts          # Sliding window
│   │   │   │   └── types.ts
│   │   │   ├── memory/             # Memory manager
│   │   │   │   ├── index.ts
│   │   │   │   ├── working.ts      # In-context session state
│   │   │   │   ├── episodic.ts     # Long-term DB-backed
│   │   │   │   ├── consolidation.ts # Summarize & prune
│   │   │   │   └── types.ts
│   │   │   ├── rag/                # RAG pipeline
│   │   │   │   ├── index.ts
│   │   │   │   ├── embedder.ts     # Embedding generation
│   │   │   │   ├── retriever.ts    # Search & ranking
│   │   │   │   ├── cache.ts        # Query result cache
│   │   │   │   └── types.ts
│   │   │   ├── state/              # Minecraft state manager
│   │   │   │   ├── index.ts
│   │   │   │   ├── processor.ts    # Raw→natural language
│   │   │   │   └── types.ts
│   │   │   ├── planner/            # Goal decomposition
│   │   │   │   ├── index.ts
│   │   │   │   ├── goal-parser.ts  # Identify goals from AI response
│   │   │   │   ├── decomposer.ts   # Goal→Task breakdown
│   │   │   │   ├── replanner.ts    # Handle failures
│   │   │   │   └── types.ts
│   │   │   ├── scheduler/          # Priority queue & interrupts
│   │   │   │   ├── index.ts
│   │   │   │   ├── priority-queue.ts
│   │   │   │   ├── interrupt.ts    # Interrupt handler
│   │   │   │   └── types.ts
│   │   │   ├── function/           # Function call execution
│   │   │   │   ├── index.ts
│   │   │   │   ├── registry.ts     # Function whitelist
│   │   │   │   ├── executor.ts     # Send to mod, await result
│   │   │   │   └── types.ts
│   │   │   ├── proactive/          # Proactive rule engine
│   │   │   │   ├── index.ts
│   │   │   │   ├── rules.ts        # Rule definitions
│   │   │   │   └── types.ts
│   │   │   └── analytics/          # Metrics & logging
│   │   │       ├── index.ts
│   │   │       └── types.ts
│   │   ├── gemini/                 # Gemini API wrapper
│   │   │   ├── index.ts            # Client class
│   │   │   ├── circuit-breaker.ts  # Failure protection
│   │   │   ├── token-tracker.ts    # Usage tracking
│   │   │   └── types.ts
│   │   ├── db/                     # Database layer
│   │   │   ├── index.ts            # Connection setup
│   │   │   ├── schema.ts           # Drizzle schema
│   │   │   └── migrations/         # SQL migrations
│   │   ├── protocol/               # Shared protocol types
│   │   │   ├── messages.ts         # Message type definitions
│   │   │   ├── events.ts           # Event payload types
│   │   │   ├── functions.ts        # Function call types
│   │   │   ├── errors.ts           # Error code definitions
│   │   │   └── version.ts          # Protocol version constant
│   │   └── types/                  # Shared utility types
│   │       ├── index.ts
│   │       └── result.ts           # Result<T, E> type
│   ├── tests/
│   │   ├── unit/                   # Per-module unit tests
│   │   └── integration/            # Cross-module tests
│   ├── package.json
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   ├── .env.example
│   └── drizzle.config.ts
│
├── mod/                            # Fabric Minecraft Mod (Java 21)
│   ├── src/main/java/com/companion/
│   │   ├── CompanionMod.java       # Mod entry point (implements ModInitializer)
│   │   ├── client/
│   │   │   ├── CompanionClient.java    # Client entry (ClientModInitializer)
│   │   │   ├── ui/
│   │   │   │   ├── ChatOverlay.java    # Chat display overlay
│   │   │   │   ├── StatusIndicator.java # Connection status HUD
│   │   │   │   ├── DebugOverlay.java   # Debug info overlay (toggleable)
│   │   │   │   └── ConfigScreen.java   # In-game config screen
│   │   │   └── audio/
│   │   │       └── VoicePlayer.java    # TTS audio playback (future)
│   │   ├── network/
│   │   │   ├── WebSocketClient.java    # WS connection management
│   │   │   ├── MessageHandler.java     # Incoming message routing
│   │   │   ├── MessageSender.java      # Outgoing message construction
│   │   │   └── ReconnectionManager.java # Exponential backoff
│   │   ├── state/
│   │   │   ├── PlayerStateTracker.java # Health, hunger, armor, inventory
│   │   │   ├── WorldStateTracker.java  # Biome, time, weather, entities
│   │   │   └── DeltaCalculator.java    # Compute state diffs
│   │   ├── event/
│   │   │   ├── EventListener.java      # Fabric event hooks
│   │   │   ├── EventDebouncer.java     # Debounce/throttle logic
│   │   │   └── EventBuffer.java        # Ring buffer (offline events)
│   │   ├── action/
│   │   │   ├── ActionExecutor.java     # Execute function calls
│   │   │   ├── ActionRegistry.java     # Whitelist registry
│   │   │   └── actions/               # Individual action classes
│   │   │       ├── FollowPlayerAction.java
│   │   │       ├── WalkToAction.java
│   │   │       ├── MineBlockAction.java
│   │   │       ├── AttackEntityAction.java
│   │   │       ├── EatFoodAction.java
│   │   │       ├── SleepAction.java
│   │   │       ├── OpenChestAction.java
│   │   │       ├── CraftItemAction.java
│   │   │       ├── PlaceBlockAction.java
│   │   │       ├── PlaceTorchAction.java
│   │   │       ├── EquipItemAction.java
│   │   │       └── SearchRecipeAction.java
│   │   ├── config/
│   │   │   └── CompanionConfig.java    # Configuration management
│   │   └── protocol/
│   │       ├── Message.java            # Base message record
│   │       ├── MessageType.java        # Message type enum
│   │       ├── MessageSerializer.java  # JSON serialization (Gson)
│   │       ├── ProtocolVersion.java    # Version constant
│   │       └── payloads/              # Payload records per message type
│   │           ├── ChatPayload.java
│   │           ├── StateUpdatePayload.java
│   │           ├── EventPayload.java
│   │           ├── FunctionCallPayload.java
│   │           ├── FunctionResultPayload.java
│   │           ├── ErrorPayload.java
│   │           └── ConnectionPayload.java
│   ├── src/main/resources/
│   │   ├── fabric.mod.json
│   │   ├── assets/companion/
│   │   │   ├── icon.png
│   │   │   └── lang/
│   │   │       ├── en_us.json
│   │   │       └── id_id.json
│   │   └── companion.mixins.json       # Only if needed
│   ├── build.gradle
│   ├── settings.gradle
│   └── gradle.properties
│
├── docs/                           # Documentation
│   ├── sds.md                      # This file (Software Design Specification)
│   └── prompts/                    # Gemini prompt templates
│       └── system.md               # System prompt template
│
├── draft_mod_mc.md                 # Architecture document
├── .agents/                        # Antigravity agent config
│   ├── rules/
│   └── workflows/
├── .gitignore
└── README.md
```

## Packages

### Backend (Node.js)

| Package | Version | Purpose |
|---|---|---|
| `typescript` | ^5.5 | Language |
| `tsx` | ^4.x | Dev runner |
| `tsup` | ^8.x | Build tool |
| `ws` | ^8.x | WebSocket server |
| `@google/generative-ai` | ^0.x (latest) | Gemini API client |
| `drizzle-orm` | ^0.33 | ORM |
| `better-sqlite3` | ^11.x | SQLite driver |
| `drizzle-kit` | ^0.24 | Migration tooling |
| `zod` | ^3.23 | Schema validation |
| `uuid` | ^10.x | UUID generation |
| `pino` | ^9.x | Structured JSON logging |
| `vitest` | ^2.x | Testing framework |
| `eslint` | ^9.x | Linting |
| `prettier` | ^3.x | Formatting |

### Mod (Java/Fabric)

| Dependency | Purpose |
|---|---|
| `fabric-loader` | Mod loader |
| `fabric-api` | Fabric API hooks |
| `java-websocket` (org.java-websocket:Java-WebSocket) | WebSocket client |
| `gson` (bundled with MC) | JSON serialization |

---

# 2. WebSocket Protocol v1.0

## Base Message Envelope

Every message between Mod and Backend follows this structure:

```typescript
interface Message {
  version: "1.0";
  type: MessageType;
  id: string;          // UUID v4
  timestamp: number;   // Unix milliseconds
  payload: Record<string, unknown>;
}

type MessageType =
  | "chat"
  | "state_update"
  | "event"
  | "function_call"
  | "function_result"
  | "error"
  | "heartbeat"
  | "connection_init"
  | "connection_ack";
```

```java
public record Message(
    String version,
    String type,
    String id,
    long timestamp,
    JsonObject payload
) {}
```

## Connection Lifecycle

```
Mod connects to ws://localhost:3000
    │
    ▼
Mod sends: connection_init
    │
    ▼
Backend validates version compatibility
    │
    ├── Compatible → sends: connection_ack (status: "ok")
    │                       │
    │                       ▼
    │               Connection established
    │               Heartbeats begin (every 15s)
    │               Mod sends initial full state_update
    │
    └── Incompatible → sends: connection_ack (status: "version_mismatch")
                        │
                        ▼
                    Backend closes connection
```

## Message Type Specifications

### 2.1 connection_init (Mod → Backend)

Sent immediately after WebSocket connection is established.

```json
{
  "version": "1.0",
  "type": "connection_init",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": 1719657600000,
  "payload": {
    "protocol_version": "1.0",
    "mod_version": "0.1.0",
    "player_name": "Defry",
    "player_uuid": "player-uuid-here",
    "minecraft_version": "1.21.1"
  }
}
```

### 2.2 connection_ack (Backend → Mod)

Response to connection_init.

```json
{
  "version": "1.0",
  "type": "connection_ack",
  "id": "...",
  "timestamp": 1719657600100,
  "payload": {
    "status": "ok",
    "session_id": "session-uuid",
    "companion_name": "Luna",
    "features": ["chat", "function_call", "proactive"]
  }
}
```

Status values: `"ok"` | `"version_mismatch"` | `"rejected"`

### 2.3 chat (Bidirectional)

```json
{
  "version": "1.0",
  "type": "chat",
  "id": "...",
  "timestamp": 1719657601000,
  "payload": {
    "from": "player",
    "format": "text",
    "content": "Hey, ada diamond nggak di sekitar sini?",
    "reply_to": null
  }
}
```

```json
{
  "version": "1.0",
  "type": "chat",
  "id": "...",
  "timestamp": 1719657602000,
  "payload": {
    "from": "ai",
    "format": "text",
    "content": "Hmm, coba kita turun ke Y=-53. Biasanya diamond ada di situ!",
    "reply_to": "id-of-player-message",
    "streaming": false
  }
}
```

Fields:
- `from`: `"player"` | `"ai"`
- `format`: `"text"` | `"voice"` (future)
- `content`: Message text
- `reply_to`: UUID of message being replied to, or `null`
- `streaming`: `true` if this is a partial streaming chunk, `false` if complete (AI→Player only)

### 2.4 state_update (Mod → Backend)

Delta-only updates. First message after connection sends full snapshot.

```json
{
  "version": "1.0",
  "type": "state_update",
  "id": "...",
  "timestamp": 1719657603000,
  "payload": {
    "is_full_sync": false,
    "changes": {
      "player": {
        "health": 14.0,
        "hunger": 18
      },
      "inventory": {
        "slots": {
          "3": { "item": "minecraft:iron_sword", "count": 1, "durability": 250 },
          "7": null
        }
      }
    }
  }
}
```

Full sync (sent on initial connection):

```json
{
  "version": "1.0",
  "type": "state_update",
  "id": "...",
  "timestamp": 1719657600200,
  "payload": {
    "is_full_sync": true,
    "changes": {
      "player": {
        "health": 20.0,
        "max_health": 20.0,
        "hunger": 20,
        "saturation": 5.0,
        "armor": 12,
        "level": 15,
        "experience": 0.45,
        "position": { "x": 100.5, "y": 64.0, "z": -200.3 },
        "rotation": { "yaw": 90.0, "pitch": 0.0 },
        "dimension": "minecraft:overworld",
        "gamemode": "survival"
      },
      "inventory": {
        "slots": {
          "0": { "item": "minecraft:diamond_pickaxe", "count": 1, "durability": 1561 },
          "1": { "item": "minecraft:torch", "count": 32, "durability": null },
          "2": null
        },
        "selected_slot": 0
      },
      "world": {
        "biome": "minecraft:plains",
        "time": 6000,
        "day_phase": "noon",
        "weather": "clear",
        "difficulty": "normal",
        "is_raining": false,
        "is_thundering": false
      },
      "entities": {
        "nearby": [
          {
            "type": "minecraft:zombie",
            "name": null,
            "distance": 12.5,
            "health": 20.0,
            "position": { "x": 112.0, "y": 64.0, "z": -195.0 },
            "is_hostile": true
          }
        ]
      }
    }
  }
}
```

### 2.5 event (Mod → Backend)

```json
{
  "version": "1.0",
  "type": "event",
  "id": "...",
  "timestamp": 1719657604000,
  "payload": {
    "event_type": "player_hurt",
    "buffered": false,
    "data": {
      "damage": 4.0,
      "source": "minecraft:zombie",
      "source_name": "Zombie",
      "health_after": 16.0
    }
  }
}
```

Fields:
- `event_type`: Event name from the Event Catalog (Section 3)
- `buffered`: `true` if this event was buffered during disconnection
- `data`: Event-specific payload (see Section 3)

### 2.6 function_call (Backend → Mod)

```json
{
  "version": "1.0",
  "type": "function_call",
  "id": "...",
  "timestamp": 1719657605000,
  "payload": {
    "call_id": "call-uuid",
    "function": "mine_block",
    "params": {
      "x": 100,
      "y": 12,
      "z": -200
    },
    "requires_confirmation": true,
    "confirmation_message": "Mine the block at (100, 12, -200)?"
  }
}
```

Fields:
- `call_id`: Unique ID for this call (used to match with result)
- `function`: Function name from the Function Catalog (Section 5)
- `params`: Function parameters (see Section 5)
- `requires_confirmation`: Whether player must confirm before execution
- `confirmation_message`: Human-readable confirmation prompt (if applicable)

### 2.7 function_result (Mod → Backend)

```json
{
  "version": "1.0",
  "type": "function_result",
  "id": "...",
  "timestamp": 1719657606000,
  "payload": {
    "call_id": "call-uuid",
    "status": "success",
    "result": {
      "block_mined": "minecraft:diamond_ore",
      "items_dropped": [
        { "item": "minecraft:diamond", "count": 1 }
      ]
    },
    "error": null,
    "duration_ms": 1500
  }
}
```

Fields:
- `call_id`: Matches the `call_id` from the function_call message
- `status`: `"success"` | `"failure"` | `"partial"` | `"cancelled"` | `"rejected"`
- `result`: Function-specific result (see Section 5). `null` on failure.
- `error`: Error object on failure (see Section 12). `null` on success.
- `duration_ms`: How long the action took to execute

Status meanings:
- `success` — Action completed successfully
- `failure` — Action failed (see error)
- `partial` — Action partially completed (e.g., mined 2 of 3 blocks)
- `cancelled` — Action was interrupted by Scheduler
- `rejected` — Player rejected confirmation

### 2.8 error (Bidirectional)

```json
{
  "version": "1.0",
  "type": "error",
  "id": "...",
  "timestamp": 1719657607000,
  "payload": {
    "code": "API_RATE_LIMITED",
    "category": "APIError",
    "message": "Gemini API rate limit exceeded. Retrying in 30 seconds.",
    "severity": "warning",
    "retry_after_ms": 30000,
    "context": {
      "module": "gemini",
      "attempt": 2,
      "max_attempts": 3
    }
  }
}
```

### 2.9 heartbeat (Bidirectional)

```json
{
  "version": "1.0",
  "type": "heartbeat",
  "id": "...",
  "timestamp": 1719657608000,
  "payload": {}
}
```

Rules:
- Sent every **15 seconds** by both sides.
- If no heartbeat received within **45 seconds**, connection is considered dead.
- Mod initiates reconnection with exponential backoff.

## Message Size Limits

- Maximum message size: **1 MB** (1,048,576 bytes)
- Messages exceeding this limit are rejected with `VALIDATION_MESSAGE_TOO_LARGE` error.

## Version Compatibility

- Minor version changes (1.0 → 1.1) are backward compatible. New fields may be added; existing fields are never removed.
- Major version changes (1.x → 2.0) are breaking. Backend should support previous major version for one release cycle.

---

# 3. Event Catalog

Complete list of all game events sent from Mod to Backend.

## Critical Events (Immediate — No Debounce)

| Event Type | Payload | Priority |
|---|---|---|
| `player_death` | `{ cause: string, killer: string \| null, position: Position, dimension: string }` | P0 |
| `player_respawn` | `{ position: Position, dimension: string }` | P1 |
| `dimension_change` | `{ from: string, to: string, position: Position }` | P1 |
| `boss_spawn` | `{ boss_type: string, boss_name: string, distance: number }` | P0 |
| `boss_defeated` | `{ boss_type: string, boss_name: string }` | P2 |
| `advancement` | `{ advancement_id: string, advancement_title: string, description: string }` | P2 |
| `totem_used` | `{ health_after: number }` | P0 |

## High-Frequency Events (Debounced)

| Event Type | Payload | Debounce | Priority |
|---|---|---|---|
| `player_hurt` | `{ total_damage: number, sources: Array<{ source: string, damage: number }>, health_after: number, hits: number }` | 2s aggregate | P1 |
| `item_pickup` | `{ items: Array<{ item: string, count: number }> }` | 3s aggregate | P4 |
| `block_mined` | `{ blocks: Array<{ block: string, count: number }>, tool_used: string }` | 5s aggregate | P4 |
| `entity_killed` | `{ entities: Array<{ entity: string, count: number }>, weapon_used: string }` | 3s aggregate | P3 |
| `experience_gained` | `{ total_xp: number, new_level: number \| null }` | 5s aggregate | P4 |

## On-Change Events (No Debounce, but Only When State Changes)

| Event Type | Payload | Priority |
|---|---|---|
| `item_crafted` | `{ item: string, count: number, recipe_type: string }` | P3 |
| `item_used` | `{ item: string, target: string \| null }` | P3 |
| `armor_changed` | `{ slot: string, old_item: string \| null, new_item: string \| null, total_armor: number }` | P3 |
| `player_sleep` | `{ bed_position: Position }` | P3 |
| `player_wake` | `{ slept_through_night: boolean }` | P3 |
| `chest_opened` | `{ position: Position, contents_summary: Array<{ item: string, count: number }> }` | P4 |
| `chat_received` | `{ sender: string, message: string }` | P2 |
| `biome_changed` | `{ old_biome: string, new_biome: string }` | P4 |
| `weather_changed` | `{ old_weather: string, new_weather: string }` | P4 |

## Shared Types

```typescript
interface Position {
  x: number;
  y: number;
  z: number;
}
```

---

# 4. State Update Specification

## Update Frequency Rules

| State Category | Trigger | Max Frequency |
|---|---|---|
| `player.health` | On change | Immediate |
| `player.hunger` | On change | Immediate |
| `player.armor` | On change | Immediate |
| `player.position` | Moved > 10 blocks OR every 5s | 0.2 Hz |
| `player.rotation` | Not sent regularly | On request only |
| `player.level` | On change | Immediate |
| `player.dimension` | On change | Immediate |
| `player.gamemode` | On change | Immediate |
| `inventory.slots` | On change | Immediate |
| `inventory.selected_slot` | On change | Immediate |
| `world.biome` | On change | Immediate |
| `world.time` | On day_phase change | ~4 per MC day |
| `world.weather` | On change | Immediate |
| `entities.nearby` | Every 3s | 0.33 Hz |

## Day Phase Values

| MC Time Range | Day Phase |
|---|---|
| 0 - 6000 | `"dawn"` |
| 6000 - 12000 | `"noon"` |
| 12000 - 13000 | `"dusk"` |
| 13000 - 23000 | `"night"` |
| 23000 - 24000 | `"dawn"` |

## Delta Format Rules

1. **Only changed fields are sent.** If `health` didn't change, it's not in the payload.
2. **Null means removed.** `"slot_7": null` means slot 7 is now empty.
3. **Nested objects are merged, not replaced.** Sending `{ "player": { "health": 10 } }` updates only `health`, not the entire `player` object.
4. **`is_full_sync: true`** sends the complete state. Used only on initial connection and reconnection.
5. **Arrays are replaced entirely** (e.g., `entities.nearby` is always the full current list, not a diff).

## Entity Format

```typescript
interface NearbyEntity {
  type: string;              // e.g., "minecraft:zombie"
  name: string | null;       // Custom name tag, null if unnamed
  distance: number;          // Distance from player in blocks
  health: number;            // Current health
  max_health: number;        // Max health
  position: Position;
  is_hostile: boolean;
  is_tamed: boolean;         // For wolves, cats, etc.
}
```

- Maximum 10 nearest entities sent per update.
- Only entities within 30 blocks radius.
- Sorted by distance (nearest first).

## Inventory Slot Format

```typescript
interface InventorySlot {
  item: string;              // Namespaced ID: "minecraft:diamond_sword"
  count: number;             // Stack size
  durability: number | null; // Remaining durability, null if not applicable
  enchantments: string[];    // List of enchantment IDs (simplified)
  custom_name: string | null; // Renamed items
}
```

- Slots are numbered 0-35 (main inventory) + 36-39 (armor) + 40 (offhand).
- Empty slot = `null`.

---

# 5. Function Call Catalog

## Non-Destructive Functions (Auto-execute)

### follow_player

```
Description: Start following the player at a specified distance.
Params:
  distance: number (default: 3, range: 1-10) — blocks behind player
Result:
  following: boolean
Errors:
  ALREADY_FOLLOWING — Already following the player
```

### stop_following

```
Description: Stop following the player.
Params: (none)
Result:
  stopped: boolean
Errors:
  NOT_FOLLOWING — Not currently following
```

### walk_to

```
Description: Walk to a specific position.
Params:
  x: number
  y: number
  z: number
Result:
  arrived: boolean
  final_position: Position
Errors:
  NO_PATH — Cannot find path to target
  TOO_FAR — Target is more than 100 blocks away
  INTERRUPTED — Movement was interrupted
```

### search_recipe

```
Description: Look up a crafting recipe for an item.
Params:
  item: string — Item namespaced ID (e.g., "minecraft:iron_pickaxe")
Result:
  found: boolean
  recipes: Array<{
    type: string,           // "crafting_shaped", "crafting_shapeless", "smelting"
    ingredients: string[],  // List of ingredient item IDs
    result_count: number
  }>
Errors:
  UNKNOWN_ITEM — Item ID not recognized
```

### look_at

```
Description: Turn to look at a position or entity.
Params:
  target: "position" | "entity"
  x: number (if position)
  y: number (if position)
  z: number (if position)
  entity_type: string (if entity — looks at nearest of this type)
Result:
  looking_at: string
Errors:
  ENTITY_NOT_FOUND — No entity of that type nearby
```

## Mild Functions (Auto-execute)

### eat_food

```
Description: Eat the best food item available in inventory.
Params:
  item: string | null — Specific food item to eat. Null = auto-select best.
Result:
  eaten: string         — Item that was eaten
  hunger_restored: number
  health_after: number
Errors:
  NO_FOOD — No food in inventory
  NOT_HUNGRY — Hunger is already full
  ITEM_NOT_FOOD — Specified item is not edible
```

### equip_item

```
Description: Equip an item from inventory to a specific slot.
Params:
  item: string          — Item to equip
  slot: "mainhand" | "offhand" | "head" | "chest" | "legs" | "feet"
Result:
  equipped: boolean
  previous_item: string | null
Errors:
  ITEM_NOT_FOUND — Item not in inventory
  WRONG_SLOT — Item cannot be equipped to that slot
```

### place_torch

```
Description: Place a torch at a specific position.
Params:
  x: number
  y: number
  z: number
Result:
  placed: boolean
  position: Position
Errors:
  NO_TORCHES — No torches in inventory
  CANNOT_PLACE — Invalid placement position
  TOO_FAR — Position is out of reach
```

## Destructive Functions (Configurable Confirmation)

### mine_block

```
Description: Mine a block at a specific position.
Params:
  x: number
  y: number
  z: number
Result:
  block_mined: string
  items_dropped: Array<{ item: string, count: number }>
Errors:
  BLOCK_UNBREAKABLE — Block cannot be mined (bedrock, etc.)
  NO_TOOL — No appropriate tool for this block
  TOO_FAR — Block is out of reach (> 5 blocks)
  SAFETY_BOUNDARY — Block is within base safety radius
```

### attack_entity

```
Description: Attack the nearest entity of a specified type.
Params:
  entity_type: string
  max_distance: number (default: 5)
Result:
  target: string
  damage_dealt: number
  target_health: number
  target_killed: boolean
Errors:
  ENTITY_NOT_FOUND — No entity of that type within range
  PROTECTED_ENTITY — Entity is tamed or named (safety rule)
  TOO_FAR — Entity is beyond max_distance
```

### craft_item

```
Description: Craft an item if ingredients are available.
Params:
  item: string          — Item to craft
  count: number         — How many to craft (default: 1)
Result:
  crafted: string
  count: number
  remaining_ingredients: Array<{ item: string, count: number }>
Errors:
  MISSING_INGREDIENTS — Not enough materials
  UNKNOWN_RECIPE — No recipe found for this item
  NO_CRAFTING_TABLE — Recipe requires crafting table but none nearby
```

### place_block

```
Description: Place a block at a specific position.
Params:
  block: string         — Block item to place
  x: number
  y: number
  z: number
Result:
  placed: boolean
  position: Position
Errors:
  BLOCK_NOT_FOUND — Block not in inventory
  CANNOT_PLACE — Invalid placement
  TOO_FAR — Out of reach
  SAFETY_BOUNDARY — Within base safety radius
```

### open_chest

```
Description: Open a chest and report its contents.
Params:
  x: number
  y: number
  z: number
Result:
  contents: Array<{ item: string, count: number, slot: number }>
  chest_type: "single" | "double"
Errors:
  NO_CHEST — No chest at specified position
  TOO_FAR — Out of reach
  CHEST_LOCKED — Chest is locked
```

## Dangerous Functions (Always Confirm)

### sleep

```
Description: Use the nearest bed to sleep.
Params: (none)
Result:
  slept: boolean
  skipped_night: boolean
Errors:
  NO_BED — No bed nearby
  NOT_NIGHT — Can only sleep at night
  MONSTERS_NEARBY — Hostile mobs too close
  BED_OCCUPIED — Bed is occupied
```

## Rate Limiting

- Default: **5 function calls per 10 seconds**.
- Configurable via `config.gameplay.max_actions_per_10s`.
- Exceeding rate limit returns error code `RATE_LIMITED`.

---

# 6. Blackboard Schema

## Entry Definitions

```typescript
interface BlackboardEntries {
  // === Player State (written by: StateManager) ===
  player_health: number;              // 0.0 - 20.0
  player_max_health: number;          // Usually 20.0
  player_hunger: number;              // 0 - 20
  player_saturation: number;          // 0.0 - 20.0
  player_armor: number;               // 0 - 20
  player_level: number;               // XP level
  player_position: Position;
  player_dimension: string;           // "minecraft:overworld" etc.
  player_gamemode: string;            // "survival", "creative", etc.

  // === Inventory (written by: StateManager) ===
  inventory_slots: Record<string, InventorySlot | null>;  // Slot number → item
  inventory_selected_slot: number;
  inventory_space_used: number;       // Count of non-empty slots
  inventory_total_slots: number;      // 36

  // === World State (written by: StateManager) ===
  world_biome: string;
  world_time: number;                 // MC tick time
  world_day_phase: DayPhase;          // "dawn" | "noon" | "dusk" | "night"
  world_weather: Weather;             // "clear" | "rain" | "thunder"
  world_difficulty: string;

  // === Nearby Entities (written by: StateManager) ===
  nearby_entities: NearbyEntity[];
  nearby_hostile_count: number;
  nearest_hostile_distance: number | undefined;  // undefined if no hostiles

  // === Danger Assessment (written by: ProactiveEngine) ===
  threat_level: ThreatLevel;          // "none" | "low" | "medium" | "high" | "critical"
  primary_threat: string | undefined; // Entity type of biggest threat
  should_flee: boolean;

  // === Goals (written by: Planner) ===
  current_goal: Goal | undefined;
  active_plan: Plan | undefined;
  current_plan_step: number;          // Index into plan.tasks
  goal_progress: number;              // 0.0 - 1.0

  // === Player Intent (written by: ConversationManager) ===
  last_player_message: string | undefined;
  inferred_intent: PlayerIntent;      // "chat" | "question" | "command" | "goal"
  conversation_topic: string | undefined;

  // === AI State (written by: Scheduler, FunctionManager) ===
  ai_status: AIStatus;                // "idle" | "thinking" | "talking" | "planning" | "executing"
  current_task: string | undefined;   // Human-readable current action
  last_action_result: FunctionResult | undefined;
  is_interrupted: boolean;

  // === Session (written by: ConversationManager) ===
  session_id: string;
  session_start: number;              // Timestamp
  message_count: number;              // Messages this session
  token_usage: TokenUsage;
}

type DayPhase = "dawn" | "noon" | "dusk" | "night";
type Weather = "clear" | "rain" | "thunder";
type ThreatLevel = "none" | "low" | "medium" | "high" | "critical";
type PlayerIntent = "chat" | "question" | "command" | "goal";
type AIStatus = "idle" | "thinking" | "talking" | "planning" | "executing";

interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  total_cost_estimate: number;  // In USD
}
```

## Default Values

```typescript
const BLACKBOARD_DEFAULTS: BlackboardEntries = {
  player_health: 20.0,
  player_max_health: 20.0,
  player_hunger: 20,
  player_saturation: 5.0,
  player_armor: 0,
  player_level: 0,
  player_position: { x: 0, y: 64, z: 0 },
  player_dimension: "minecraft:overworld",
  player_gamemode: "survival",

  inventory_slots: {},
  inventory_selected_slot: 0,
  inventory_space_used: 0,
  inventory_total_slots: 36,

  world_biome: "minecraft:plains",
  world_time: 0,
  world_day_phase: "dawn",
  world_weather: "clear",
  world_difficulty: "normal",

  nearby_entities: [],
  nearby_hostile_count: 0,
  nearest_hostile_distance: undefined,

  threat_level: "none",
  primary_threat: undefined,
  should_flee: false,

  current_goal: undefined,
  active_plan: undefined,
  current_plan_step: 0,
  goal_progress: 0.0,

  last_player_message: undefined,
  inferred_intent: "chat",
  conversation_topic: undefined,

  ai_status: "idle",
  current_task: undefined,
  last_action_result: undefined,
  is_interrupted: false,

  session_id: "",
  session_start: 0,
  message_count: 0,
  token_usage: { input_tokens: 0, output_tokens: 0, total_cost_estimate: 0 },
};
```

## Reader/Writer Matrix

| Entry Category | Writers | Readers |
|---|---|---|
| Player State | StateManager | All |
| Inventory | StateManager | Planner, Conversation, Proactive |
| World State | StateManager | Proactive, Conversation, Planner |
| Nearby Entities | StateManager | Proactive, Scheduler, Planner |
| Danger Assessment | ProactiveEngine | Scheduler, Planner, Conversation |
| Goals | Planner | Scheduler, Conversation, Memory |
| Player Intent | ConversationManager | Planner, Memory, RAG |
| AI State | Scheduler, FunctionManager | Conversation, Proactive |
| Session | ConversationManager | Memory, Analytics |

---

# 7. Planner Specification

## Goal Format

```typescript
interface Goal {
  id: string;                         // UUID
  description: string;                // "Find and mine diamonds"
  source: "player" | "proactive";     // Who initiated
  created_at: number;                 // Timestamp
  status: GoalStatus;
  priority: SchedulerPriority;        // Default P2
}

type GoalStatus = "pending" | "planning" | "executing" | "paused" | "completed" | "failed" | "cancelled";
```

## Plan Format

```typescript
interface Plan {
  id: string;                         // UUID
  goal_id: string;                    // Reference to parent Goal
  tasks: Task[];
  current_step: number;               // 0-indexed
  created_at: number;
  status: PlanStatus;
  replanned_count: number;            // How many times this plan was revised
  max_replans: number;                // Default: 3
}

type PlanStatus = "created" | "executing" | "paused" | "completed" | "failed" | "cancelled";
```

## Task Format

```typescript
interface Task {
  id: string;                         // UUID
  step: number;                       // Order in plan (0-indexed)
  description: string;                // "Check inventory for iron pickaxe"
  type: TaskType;
  status: TaskStatus;
  function_call: FunctionCallSpec | null;  // If type is "function"
  condition: string | null;           // If type is "conditional"
  started_at: number | null;
  completed_at: number | null;
  result: unknown | null;
  error: string | null;
}

type TaskType = "function" | "check" | "conditional" | "wait" | "gemini_query";
type TaskStatus = "pending" | "running" | "completed" | "failed" | "skipped";

interface FunctionCallSpec {
  function: string;                   // Function name from catalog
  params: Record<string, unknown>;    // Function parameters
}
```

## Task Types

| Type | Description | Example |
|---|---|---|
| `function` | Execute a function call via Mod | mine_block, walk_to, craft_item |
| `check` | Read Blackboard state, evaluate condition | "Do we have an iron pickaxe?" |
| `conditional` | Branch based on check result | "If no pickaxe → insert craft subtasks" |
| `wait` | Wait for a condition on Blackboard | "Wait until near Y=-53" |
| `gemini_query` | Ask Gemini for additional reasoning | "What's the best approach to..." |

## Plan Routing Rules

| Complexity | Detection | Planning Method |
|---|---|---|
| Simple (1-2 steps) | Direct function call, no preconditions | Local rule engine. No Gemini needed. |
| Medium (3-5 steps) | Clear goal, known recipe/path | Gemini single-shot: generate plan in one call. |
| Complex (5+ steps) | Vague goal, unknown preconditions | Gemini multi-shot: plan first few steps, replan as situation evolves. |

## Replanning Rules

Replanning is triggered when:

1. A task returns `status: "failure"`.
2. Blackboard state changes significantly during execution (e.g., inventory lost on death).
3. Player sends a new message that modifies the goal.
4. Scheduler interrupts with P0/P1 event that changes context.

Replanning process:

```
Current state:
  - Plan: [A, B, C, D, E]
  - Completed: [A✓, B✓]
  - Failed at: C

Replanning prompt to Gemini:
  "Original goal: {goal}
   Completed steps: A, B
   Failed step: C — Reason: {error}
   Current state: {blackboard snapshot}
   Please create a revised plan to complete the goal."

Result:
  New plan: [C', D', E']
  (Continues from current state, doesn't redo A and B)
```

Maximum replans per goal: **3** (configurable). After 3 failed replans, the goal is marked `failed` and AI reports to player.

---

# 8. Scheduler Specification

## Priority Levels

```typescript
enum SchedulerPriority {
  P0_CRITICAL = 0,   // Life-threatening, requires immediate action
  P1_HIGH = 1,       // Dangerous, should act soon
  P2_NORMAL = 2,     // Planned work, proactive tasks
  P3_LOW = 3,        // Nice-to-have suggestions
  P4_IDLE = 4,       // Background conversation, ambient
}
```

## Work Items

```typescript
interface WorkItem {
  id: string;                         // UUID
  priority: SchedulerPriority;
  type: WorkItemType;
  payload: unknown;                   // Type-specific payload
  submitted_at: number;
  started_at: number | null;
  source: string;                     // Which module submitted this
  can_interrupt: boolean;             // Can this item be interrupted?
  ttl_ms: number | null;             // Time-to-live. Null = no expiry.
}

type WorkItemType =
  | "function_call"                   // Execute a function in Minecraft
  | "ai_response"                     // Generate and send AI chat/voice response
  | "plan_step"                       // Execute next step of a plan
  | "proactive_alert"                 // Proactive engine warning/suggestion
  | "emergency"                       // Immediate safety action
  ;
```

## Interrupt Matrix

What can interrupt what:

| Running ↓ \ Incoming → | P0 | P1 | P2 | P3 | P4 |
|---|---|---|---|---|---|
| **P0 CRITICAL** | Queue | Queue | Queue | Drop | Drop |
| **P1 HIGH** | **Interrupt** | Queue | Queue | Drop | Drop |
| **P2 NORMAL** | **Interrupt** | **Interrupt** | Queue | Queue | Drop |
| **P3 LOW** | **Interrupt** | **Interrupt** | **Interrupt** | Queue | Drop |
| **P4 IDLE** | **Interrupt** | **Interrupt** | **Interrupt** | **Interrupt** | Queue |
| **(idle)** | Execute | Execute | Execute | Execute | Execute |

- **Interrupt**: Pause current work, execute incoming, then resume.
- **Queue**: Add to priority queue, execute after current work completes.
- **Drop**: Discard. Not important enough to queue.

## Queue Configuration

- Maximum queue size: **50 items**
- Overflow strategy: Drop lowest priority items first
- Items with `ttl_ms` set are auto-removed when expired

## Pause Stack

When work is interrupted, it's pushed onto a **pause stack**:

```typescript
interface PauseStackEntry {
  work_item: WorkItem;
  paused_at: number;
  state_snapshot: Record<string, unknown>;  // Relevant state at time of pause
}
```

- Stack depth limit: **5**. If stack overflows, oldest paused item is cancelled.
- On resume, Scheduler checks if the paused item is still valid (goal not cancelled, state still compatible).

---

# 9. Database Schema

Using Drizzle ORM with SQLite (development) / PostgreSQL (future).

```typescript
import { sqliteTable, text, integer, real, blob } from 'drizzle-orm/sqlite-core';

// === Memories ===
export const memories = sqliteTable('memories', {
  id: text('id').primaryKey(),                    // UUID
  player_id: text('player_id').notNull(),
  type: text('type').notNull(),                   // 'episodic' | 'preference' | 'location' | 'objective' | 'relationship'
  content: text('content').notNull(),             // Natural language memory
  importance: real('importance').notNull().default(5.0),  // 1.0 - 10.0
  embedding: blob('embedding'),                   // Float32 embedding vector (serialized)
  tags: text('tags'),                             // JSON array of tags for filtering
  created_at: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  last_accessed: integer('last_accessed', { mode: 'timestamp_ms' }).notNull(),
  access_count: integer('access_count').notNull().default(0),
  expires_at: integer('expires_at', { mode: 'timestamp_ms' }),  // Null = never expires
});

// === Conversation Sessions ===
export const conversationSessions = sqliteTable('conversation_sessions', {
  id: text('id').primaryKey(),                    // UUID
  player_id: text('player_id').notNull(),
  summary: text('summary'),                       // AI-generated session summary
  message_count: integer('message_count').notNull().default(0),
  token_usage_input: integer('token_usage_input').notNull().default(0),
  token_usage_output: integer('token_usage_output').notNull().default(0),
  started_at: integer('started_at', { mode: 'timestamp_ms' }).notNull(),
  ended_at: integer('ended_at', { mode: 'timestamp_ms' }),
});

// === Conversation Messages ===
export const conversationMessages = sqliteTable('conversation_messages', {
  id: text('id').primaryKey(),                    // UUID
  session_id: text('session_id').notNull().references(() => conversationSessions.id),
  player_id: text('player_id').notNull(),
  role: text('role').notNull(),                   // 'player' | 'ai' | 'system'
  content: text('content').notNull(),
  token_count: integer('token_count'),
  created_at: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

// === Game Events (for analytics & replay) ===
export const gameEvents = sqliteTable('game_events', {
  id: text('id').primaryKey(),                    // UUID
  player_id: text('player_id').notNull(),
  event_type: text('event_type').notNull(),
  payload: text('payload').notNull(),             // JSON
  priority: integer('priority').notNull(),        // 0-4 (P0-P4)
  created_at: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

// === Function Call Log ===
export const functionCalls = sqliteTable('function_calls', {
  id: text('id').primaryKey(),                    // call_id UUID
  player_id: text('player_id').notNull(),
  session_id: text('session_id').references(() => conversationSessions.id),
  function_name: text('function_name').notNull(),
  params: text('params').notNull(),               // JSON
  status: text('status').notNull(),               // 'success' | 'failure' | 'partial' | 'cancelled' | 'rejected'
  result: text('result'),                         // JSON
  error_code: text('error_code'),
  duration_ms: integer('duration_ms'),
  created_at: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

// === Player Profiles ===
export const playerProfiles = sqliteTable('player_profiles', {
  id: text('id').primaryKey(),                    // Player UUID
  player_name: text('player_name').notNull(),
  personality_preset: text('personality_preset').notNull().default('friendly'),
  language: text('language').notNull().default('id'),
  first_seen: integer('first_seen', { mode: 'timestamp_ms' }).notNull(),
  last_seen: integer('last_seen', { mode: 'timestamp_ms' }).notNull(),
  total_sessions: integer('total_sessions').notNull().default(0),
  total_messages: integer('total_messages').notNull().default(0),
});
```

## Indexes

```typescript
// Performance indexes
createIndex('idx_memories_player_type').on(memories.player_id, memories.type);
createIndex('idx_memories_importance').on(memories.importance);
createIndex('idx_memories_last_accessed').on(memories.last_accessed);
createIndex('idx_sessions_player').on(conversationSessions.player_id);
createIndex('idx_messages_session').on(conversationMessages.session_id);
createIndex('idx_events_player_type').on(gameEvents.player_id, gameEvents.event_type);
createIndex('idx_function_calls_session').on(functionCalls.session_id);
```

---

# 10. Configuration Schema

## Backend Configuration (.env)

```env
# === Required ===
GEMINI_API_KEY=                       # Google AI API key

# === Optional (defaults shown) ===
WEBSOCKET_PORT=3000                   # WebSocket server port
WEBSOCKET_HOST=localhost              # WebSocket bind address
DATABASE_PATH=./data/companion.db     # SQLite database path
LOG_LEVEL=info                        # debug | info | warn | error
```

## Backend Configuration (config.json)

```json
{
  "companion": {
    "name": "Luna",
    "personality": "friendly",
    "language": "id"
  },
  "gemini": {
    "model": "gemini-2.0-flash",
    "max_output_tokens": 2048,
    "temperature": 0.8,
    "circuit_breaker": {
      "failure_threshold": 3,
      "reset_timeout_ms": 60000
    }
  },
  "context": {
    "max_tokens": 30000,
    "system_prompt_budget": 2000,
    "working_memory_budget": 2000,
    "episodic_memory_budget": 3000,
    "episodic_memory_top_k": 5,
    "rag_budget": 3000,
    "rag_top_k": 3,
    "conversation_history_budget": 15000,
    "response_reserve": 5000
  },
  "memory": {
    "importance_threshold_keep": 7,
    "importance_threshold_discard": 4,
    "consolidation_interval_messages": 50,
    "max_memories_per_player": 1000
  },
  "scheduler": {
    "max_queue_size": 50,
    "max_pause_stack": 5
  },
  "planner": {
    "max_replans": 3,
    "simple_plan_max_steps": 2,
    "medium_plan_max_steps": 5
  },
  "gameplay": {
    "max_actions_per_10s": 5,
    "safety_boundary_radius": 10,
    "confirm_destructive": true
  }
}
```

## Mod Configuration (companion.json)

Located in Fabric config directory: `.minecraft/config/companion.json`

```json
{
  "connection": {
    "backend_url": "ws://localhost:3000",
    "reconnect_max_wait_ms": 30000,
    "heartbeat_interval_ms": 15000,
    "heartbeat_timeout_ms": 45000
  },
  "state_tracking": {
    "position_update_interval_ms": 5000,
    "position_change_threshold_blocks": 10,
    "entity_update_interval_ms": 3000,
    "entity_max_count": 10,
    "entity_max_distance": 30
  },
  "events": {
    "debounce_player_hurt_ms": 2000,
    "debounce_item_pickup_ms": 3000,
    "debounce_block_mined_ms": 5000,
    "debounce_entity_killed_ms": 3000,
    "debounce_experience_ms": 5000,
    "event_buffer_max_size": 100
  },
  "ui": {
    "show_chat_overlay": true,
    "show_status_indicator": true,
    "show_debug_overlay": false,
    "chat_overlay_max_messages": 10,
    "chat_overlay_fade_ms": 10000
  },
  "voice": {
    "enabled": false,
    "volume": 0.8
  },
  "gameplay": {
    "proactive_suggestions": true,
    "destructive_action_confirmation": "ask",
    "safety_boundary_radius": 10,
    "max_actions_per_10s": 5
  }
}
```

---

# 11. Gemini Prompt Design

## System Prompt Template

```markdown
You are {companion_name}, an AI companion in Minecraft.

## Your Personality
{personality_block}

## Your Capabilities
You can:
- Talk naturally with the player
- See the player's current game state (health, inventory, position, etc.)
- Remember past conversations and adventures
- Look up Minecraft information (recipes, mechanics)
- Perform actions in the game (mine, craft, walk, fight) using function calls
- Plan multi-step goals and execute them

## Communication Rules
- Respond in {language}.
- Keep responses concise (1-3 sentences for quick replies, more for explanations).
- Be proactive: comment on interesting things, warn about danger.
- Speak like a friend, not an assistant.
- Use the player's name: {player_name}.

## Action Rules
- When the player asks you to DO something (mine, craft, go somewhere), use function calls.
- For complex goals (e.g., "find diamonds"), create a plan first.
- Always explain what you're doing and why.
- If an action fails, explain the reason and suggest alternatives.
- NEVER perform destructive actions without the player's knowledge.

## Context Awareness
- Use the game state information to inform your responses.
- Comment on danger (low health, hostile mobs) proactively.
- Reference the player's inventory when suggesting actions.
- Be aware of time of day and weather.
```

## Working Memory Injection Format

Injected at the start of each prompt, after system prompt:

```markdown
## Current Game State
**Player:** {player_name} | Health: {health}/{max_health} | Hunger: {hunger}/20 | Armor: {armor}
**Position:** ({x}, {y}, {z}) in {dimension} | Biome: {biome}
**Time:** {day_phase} | Weather: {weather}
**Key Inventory:** {top_items_summary}
**Nearby:** {entity_summary}
**Status:** {threat_level_description}
```

Example rendered:
```
## Current Game State
**Player:** Defry | Health: 14/20 | Hunger: 18/20 | Armor: 12
**Position:** (100, 64, -200) in Overworld | Biome: Plains
**Time:** Dusk (getting dark) | Weather: Clear
**Key Inventory:** Diamond Pickaxe, 32x Torch, 12x Cooked Beef, Iron Sword, 24x Cobblestone
**Nearby:** 2 Zombies (12m, 18m), 1 Skeleton (25m)
**Status:** ⚠️ Low danger — hostile mobs approaching, night coming
```

## Episodic Memory Injection Format

Retrieved via semantic search, injected after working memory:

```markdown
## Memories
- [2 days ago] We built a base together at (50, 72, -100) near a river. Defry called it "Fort Luna."
- [Yesterday] Defry died in the Nether to a Blaze. He was frustrated. We lost his diamond tools.
- [Earlier today] Defry said he wants to find an Ancient City.
```

## RAG Results Injection Format

Retrieved from vector DB, injected after memories:

```markdown
## Reference Information
[Source: Minecraft Wiki]
Diamond ore generates between Y=-64 and Y=16, with peak generation at Y=-59.
Requires an iron pickaxe or better to mine. Fortune III gives up to 4 diamonds per ore.
```

## Context Window Budget Enforcement

Before sending a prompt, the ConversationManager calculates token usage:

```
1. system_prompt_tokens = count(system_prompt)
2. working_memory_tokens = count(working_memory)
3. episodic_tokens = count(episodic_memories)   // Trim if over budget
4. rag_tokens = count(rag_results)              // Trim if over budget
5. history_tokens = count(conversation_history) // Trim oldest first

total = 1 + 2 + 3 + 4 + 5
if total > max_tokens - response_reserve:
    trim history_tokens first (summarize oldest turns)
    then trim rag_tokens (reduce top-K)
    then trim episodic_tokens (reduce top-K)
    never trim system_prompt or working_memory
```

## Function Tool Definitions for Gemini

```typescript
const tools = [
  {
    name: "follow_player",
    description: "Start following the player at a specified distance",
    parameters: {
      type: "object",
      properties: {
        distance: { type: "number", description: "Distance in blocks (1-10)", default: 3 }
      }
    }
  },
  {
    name: "mine_block",
    description: "Mine a block at the specified coordinates",
    parameters: {
      type: "object",
      properties: {
        x: { type: "number", description: "X coordinate" },
        y: { type: "number", description: "Y coordinate" },
        z: { type: "number", description: "Z coordinate" }
      },
      required: ["x", "y", "z"]
    }
  },
  // ... (all functions from Section 5)
];
```

---

# 12. Error Codes

## Error Code Format

Pattern: `CATEGORY_SPECIFIC_ERROR`

## Complete Error Registry

### Network Errors (`NETWORK_*`)

| Code | Severity | Description | Handling |
|---|---|---|---|
| `NETWORK_WEBSOCKET_TIMEOUT` | error | No heartbeat received within timeout | Reconnect with backoff |
| `NETWORK_WEBSOCKET_CLOSED` | error | WebSocket connection closed unexpectedly | Reconnect with backoff |
| `NETWORK_MESSAGE_TOO_LARGE` | warning | Message exceeds 1MB limit | Reject message, log |
| `NETWORK_SEND_FAILED` | error | Failed to send message | Buffer and retry |

### API Errors (`API_*`)

| Code | Severity | Description | Handling |
|---|---|---|---|
| `API_RATE_LIMITED` | warning | Gemini rate limit exceeded | Exponential backoff (1s, 2s, 4s) |
| `API_QUOTA_EXCEEDED` | error | Daily quota exhausted | Switch to degraded mode |
| `API_UNAVAILABLE` | error | Gemini service is down | Circuit breaker → degraded mode |
| `API_INVALID_RESPONSE` | error | Gemini returned unparseable response | Retry once, then error to user |
| `API_CONTEXT_OVERFLOW` | warning | Prompt exceeds context limit | Trim context and retry |
| `API_TIMEOUT` | warning | Gemini call timed out | Retry with backoff |

### Game State Errors (`GAME_*`)

| Code | Severity | Description | Handling |
|---|---|---|---|
| `GAME_BLOCK_UNBREAKABLE` | info | Target block cannot be mined | Report to AI for reasoning |
| `GAME_NO_PATH` | info | No pathfinding route found | Report to AI for replanning |
| `GAME_TOO_FAR` | info | Target is out of reach | Report to AI for movement |
| `GAME_NO_TOOL` | info | No appropriate tool available | Report to AI for crafting |
| `GAME_INVENTORY_FULL` | info | Cannot pick up items | Report to AI for inventory management |
| `GAME_MISSING_INGREDIENTS` | info | Cannot craft due to missing materials | Report to AI for gathering |
| `GAME_ENTITY_NOT_FOUND` | info | Target entity not in range | Report to AI for repositioning |
| `GAME_PROTECTED_ENTITY` | warning | Cannot attack tamed/named entity | Block action, report to AI |
| `GAME_SAFETY_BOUNDARY` | warning | Action blocked by safety radius | Block action, report to AI |

### Validation Errors (`VALIDATION_*`)

| Code | Severity | Description | Handling |
|---|---|---|---|
| `VALIDATION_UNKNOWN_TYPE` | warning | Unknown message type received | Log and ignore message |
| `VALIDATION_INVALID_PAYLOAD` | warning | Message payload failed validation | Log and reject |
| `VALIDATION_VERSION_MISMATCH` | error | Protocol version incompatible | Reject connection |
| `VALIDATION_UNKNOWN_FUNCTION` | warning | Unknown function name in call | Reject function call |
| `VALIDATION_INVALID_PARAMS` | warning | Function params failed validation | Reject with error |
| `VALIDATION_MESSAGE_TOO_LARGE` | warning | Message exceeds size limit | Reject message |

### Rate Limit Errors (`RATE_*`)

| Code | Severity | Description | Handling |
|---|---|---|---|
| `RATE_FUNCTION_LIMIT` | warning | Too many function calls | Queue and delay |
| `RATE_MESSAGE_LIMIT` | warning | Too many messages per second | Drop or queue |

### Internal Errors (`INTERNAL_*`)

| Code | Severity | Description | Handling |
|---|---|---|---|
| `INTERNAL_MODULE_ERROR` | error | Unexpected error in a module | Log full stack trace, notify user generically |
| `INTERNAL_DB_ERROR` | error | Database read/write failure | Log, retry once, degrade gracefully |
| `INTERNAL_MEMORY_OVERFLOW` | warning | Too many items in memory/queue | Prune oldest items |

## Error Severity Levels

| Severity | Player Notification | Logging | Recovery |
|---|---|---|---|
| `info` | No notification (AI handles contextually) | Debug level | Automatic |
| `warning` | Subtle HUD indicator | Info level | Automatic with degradation |
| `error` | Chat message explaining issue | Error level | May require player action |
| `fatal` | Full-screen notification | Error level + alert | Connection restart required |

---

# Appendix A — Personality Presets

```json
{
  "friendly": {
    "description": "Warm, enthusiastic, supportive companion",
    "traits": ["encouraging", "curious", "playful"],
    "speech_style": "Casual, uses emoji occasionally, excited about discoveries",
    "prompt_block": "You are warm, supportive, and enthusiastic. You celebrate the player's achievements, encourage them when things go wrong, and show genuine curiosity about what they're building or exploring. Your tone is like a close friend who loves Minecraft."
  },
  "mentor": {
    "description": "Knowledgeable, calm, educational guide",
    "traits": ["patient", "informative", "analytical"],
    "speech_style": "Clear, educational, shares interesting facts",
    "prompt_block": "You are a calm and knowledgeable guide. You patiently explain game mechanics, suggest optimal strategies, and share interesting Minecraft facts. You teach without being condescending and adapt your advice to the player's skill level."
  },
  "adventurer": {
    "description": "Bold, daring, always seeking the next challenge",
    "traits": ["brave", "competitive", "dramatic"],
    "speech_style": "Dramatic, uses battle cries, treats everything as an epic quest",
    "prompt_block": "You are a bold adventurer who treats every Minecraft session as an epic quest. You dramatize encounters, suggest daring strategies, and push the player to explore. You celebrate combat victories and narrate dramatic moments."
  }
}
```

---

# Appendix B — Proactive Rule Definitions

```typescript
interface ProactiveRule {
  id: string;
  condition: (bb: BlackboardEntries) => boolean;
  priority: SchedulerPriority;
  cooldown_ms: number;             // Don't re-trigger within this window
  response_type: "local" | "gemini";  // Local = predefined message, Gemini = AI generates
  local_message: string | null;    // Used if response_type is "local"
  gemini_context: string | null;   // Extra context for Gemini prompt if response_type is "gemini"
}

const PROACTIVE_RULES: ProactiveRule[] = [
  {
    id: "health_critical",
    condition: (bb) => bb.player_health <= 4,
    priority: SchedulerPriority.P0_CRITICAL,
    cooldown_ms: 30000,
    response_type: "local",
    local_message: "⚠️ Health kamu kritis! Segera makan atau berlindung!",
    gemini_context: null,
  },
  {
    id: "health_low",
    condition: (bb) => bb.player_health <= 10 && bb.player_health > 4,
    priority: SchedulerPriority.P1_HIGH,
    cooldown_ms: 60000,
    response_type: "local",
    local_message: null,
    gemini_context: "Player's health is low ({health}/20). Suggest eating or retreating.",
  },
  {
    id: "hunger_low",
    condition: (bb) => bb.player_hunger <= 6,
    priority: SchedulerPriority.P1_HIGH,
    cooldown_ms: 60000,
    response_type: "local",
    local_message: null,
    gemini_context: "Player's hunger is getting low ({hunger}/20). Remind them to eat.",
  },
  {
    id: "night_approaching",
    condition: (bb) => bb.world_day_phase === "dusk" && bb.world_weather !== "clear",
    priority: SchedulerPriority.P3_LOW,
    cooldown_ms: 300000,
    response_type: "gemini",
    local_message: null,
    gemini_context: "Night is approaching and weather is bad. Suggest shelter.",
  },
  {
    id: "inventory_full",
    condition: (bb) => bb.inventory_space_used >= bb.inventory_total_slots - 2,
    priority: SchedulerPriority.P3_LOW,
    cooldown_ms: 120000,
    response_type: "local",
    local_message: null,
    gemini_context: "Player's inventory is almost full ({used}/{total} slots). Suggest managing items.",
  },
  {
    id: "hostiles_nearby",
    condition: (bb) => bb.nearby_hostile_count >= 3 && bb.nearest_hostile_distance !== undefined && bb.nearest_hostile_distance < 15,
    priority: SchedulerPriority.P1_HIGH,
    cooldown_ms: 15000,
    response_type: "gemini",
    local_message: null,
    gemini_context: "Multiple hostile mobs ({count}) are closing in within {distance} blocks. Warn the player.",
  },
  {
    id: "new_biome",
    condition: (bb) => false, // Triggered by biome_changed event, not polling
    priority: SchedulerPriority.P4_IDLE,
    cooldown_ms: 60000,
    response_type: "gemini",
    local_message: null,
    gemini_context: "Player entered a new biome: {biome}. Make an interesting comment about it.",
  },
];
```

---

*End of Software Design Specification v1.0*
