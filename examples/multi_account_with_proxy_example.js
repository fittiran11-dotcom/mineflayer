/**
 * Multi-Account Mineflayer Bot with Proxy Support and Command System
 * This example demonstrates how to use the new multi-account management,
 * proxy rotation, and command system features.
 */

const mineflayer = require('../index')
const MultiAccountManager = require('../lib/MultiAccountManager')
const ProxyManager = require('../lib/ProxyManager')
const CommandSystem = require('../lib/CommandSystem')

// Initialize managers
const accountManager = new MultiAccountManager()
const proxyManager = new ProxyManager()
const commandSystem = new CommandSystem(accountManager)

// Setup proxies (optional)
proxyManager.addProxy('proxy1', '127.0.0.1', 8080, 'user1', 'pass1')
proxyManager.addProxy('proxy2', '127.0.0.1', 8081, 'user2', 'pass2')
proxyManager.addProxy('proxy3', '127.0.0.1', 8082, 'user3', 'pass3')

// Bot accounts configuration
const botAccounts = [
  { username: 'Bot1', host: 'localhost' },
  { username: 'Bot2', host: 'localhost' },
  { username: 'Bot3', host: 'localhost' }
]

// Create and connect all bots
botAccounts.forEach((account, index) => {
  // Optional: assign proxies to accounts
  if (index < 3) {
    proxyManager.assignProxyToAccount(account.username, `proxy${index + 1}`)
  }
  
  const bot = mineflayer.createBot({
    host: account.host,
    username: account.username,
    auth: 'offline'
  })
  
  bot.on('login', () => {
    console.log(`[${account.username}] Connected to server`)
    accountManager.addBot(bot, account.username)
  })
  
  bot.on('chat', (username, message) => {
    if (username !== bot.username) {
      console.log(`[${account.username}] ${username}: ${message}`)
    }
  })
  
  bot.on('error', err => console.log(`[${account.username}] Error:`, err))
  bot.on('kicked', reason => console.log(`[${account.username}] Kicked:`, reason))
})

// Listen to account manager events
accountManager.on('bot_added', (data) => {
  console.log(`Bot added: ${data.name}`)
})

accountManager.on('bot_removed', (data) => {
  console.log(`Bot removed: ${data.name}`)
})

// Example: Send a message to all accounts with 500ms delay between each
setTimeout(() => {
  accountManager.say('Hello from all bots!', 500)
}, 5000)

// Example: Schedule a command to execute in 10 seconds
setTimeout(() => {
  accountManager.say('This is a scheduled message', 300)
}, 10000)

// Example: Add and start auto commands
const autoCmd1 = commandSystem.addAutoCommand('status', 30000) // Every 30 seconds
const autoCmd2 = commandSystem.addAutoCommand('list-accounts', 60000) // Every 60 seconds

// Start auto command system
commandSystem.startAutoCommands()

// Start interactive terminal
console.log('\nStarting interactive command terminal in 3 seconds...')
setTimeout(() => {
  commandSystem.startInteractiveTerminal()
}, 3000)

// Listen to terminal events
commandSystem.on('command_executed', (data) => {
  if (data.success) {
    console.log(`Command executed: ${data.command}`)
  } else {
    console.log(`Command failed: ${data.command} - ${data.error}`)
  }
})

// Example commands you can use in the terminal:
// say <message> - Send message from all accounts
// say-account <account> <message> - Send message from specific account
// delay-say <delayMs> <message> - Send message with delay between accounts
// schedule <delayMs> <intervalMs> <message> - Schedule delayed message
// status - Get status of all bots
// list-accounts - List all connected accounts
// help - Show all available commands
// exit - Quit the terminal

console.log('\n=== Multi-Account Bot Started ===')
console.log(`Using ${botAccounts.length} accounts with ${Object.keys(proxyManager.proxies).length} proxies`)
console.log('Type "help" in the terminal for available commands')
