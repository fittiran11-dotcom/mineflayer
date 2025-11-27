# Mineflayer Multi-Account Features

## Overview
This document describes the new multi-account management, proxy support, and command system features added to Mineflayer.

## New Features

### 1. Multi-Account Manager (`lib/MultiAccountManager.js`)
Manage multiple bot accounts from a single manager instance.

**Features:**
- Add/remove bots dynamically
- Execute commands across all accounts with optional delays
- Send messages from multiple accounts simultaneously
- Queue-based command execution
- Event emission for bot lifecycle events

**Usage:**
```javascript
const MultiAccountManager = require('./lib/MultiAccountManager')
const manager = new MultiAccountManager()

// Add bots
manager.addBot(bot1, 'Account1')
manager.addBot(bot2, 'Account2')

// Send message from all accounts with 500ms delay between each
manager.say('Hello from all bots!', 500)

// Execute custom command on all accounts
await manager.executeCommandOnAll((bot, accountName) => {
  bot.chat(`[${accountName}] Custom message`)
}, 300)

// Get status
const status = manager.getStatus()
```

### 2. Proxy Manager (`lib/ProxyManager.js`)
Manage multiple proxies and assign them to accounts.

**Features:**
- Add/remove proxies
- Assign proxies to specific accounts
- Rotate proxies across accounts
- Parse proxy strings (http://user:pass@host:port)
- Get proxy configuration for any account

**Usage:**
```javascript
const ProxyManager = require('./lib/ProxyManager')
const proxyManager = new ProxyManager()

// Add proxies
proxyManager.addProxy('proxy1', '127.0.0.1', 8080, 'user1', 'pass1')
proxyManager.addProxy('proxy2', '127.0.0.1', 8081, 'user2', 'pass2')

// Assign proxy to account
proxyManager.assignProxyToAccount('Account1', 'proxy1')

// Rotate proxy for an account
const nextProxy = proxyManager.rotateProxyForAccount('Account1')

// Get proxy for account
const proxy = proxyManager.getProxyForAccount('Account1')
```

### 3. Command System (`lib/CommandSystem.js`)
Terminal-based command system for managing multi-account bots.

**Features:**
- Interactive terminal interface
- Pre-registered commands for common operations
- Custom command registration
- Auto-command scheduling
- Message delay support
- Queued command execution

**Built-in Commands:**
- `say <message>` - Send message from all accounts
- `say-account <account> <message>` - Send message from specific account
- `delay-say <delayMs> <message>` - Send message with delay between accounts
- `schedule <delayMs> <intervalMs> <message>` - Schedule delayed message execution
- `status` - Get status of all connected bots
- `list-accounts` - List all connected accounts
- `help` - Show available commands
- `exit` - Quit the terminal

**Usage:**
```javascript
const CommandSystem = require('./lib/CommandSystem')
const commandSystem = new CommandSystem(accountManager)

// Start interactive terminal
commandSystem.startInteractiveTerminal()

// Add auto command (runs every 30 seconds)
commandSystem.addAutoCommand('status', 30000)

// Start auto command processing
commandSystem.startAutoCommands()

// Execute command manually
const result = commandSystem.executeCommand('say Hello everyone')

// Register custom command
commandSystem.registerCommand('custom', (args, context) => {
  return `Custom command executed with args: ${args.join(' ')}`
})
```

## Message Delay System
All message sending operations support delays between account executions:

```javascript
// 500ms delay between each account sending the message
manager.say('Message', 500)

// No delay (parallel execution)
manager.say('Message', 0)
```

## TCP Protocol Support
The implementation is fully compatible with Minecraft's original TCP protocols. All bot connections use the standard Minecraft protocol through the existing mineflayer implementation.

## Example
See `examples/multi_account_with_proxy_example.js` for a complete working example.

## Integration
These modules integrate seamlessly with existing Mineflayer code:

```javascript
const mineflayer = require('mineflayer')
const MultiAccountManager = require('./lib/MultiAccountManager')

const manager = new MultiAccountManager()

const bot = mineflayer.createBot({
  host: 'localhost',
  username: 'Bot1',
  auth: 'offline'
})

bot.on('login', () => {
  manager.addBot(bot, 'Bot1')
})
```

## Event Emission
All managers emit events for monitoring:

```javascript
manager.on('bot_added', (data) => {
  console.log(`Bot added: ${data.name}`)
})

proxyManager.on('proxy_assigned', (data) => {
  console.log(`Proxy assigned to ${data.account}`)
})

commandSystem.on('command_executed', (data) => {
  console.log(`Command ${data.command} executed`)
})
```

## Requirements
- Node.js >= 18
- Mineflayer
- Standard Node.js modules (events, util, readline, net)

## Notes
- All operations are asynchronous-safe
- Proxy rotation uses round-robin strategy
- Commands are queued and executed sequentially
- Message delays prevent server spam
