const EventEmitter = require('events').EventEmitter
const util = require('util')
const readline = require('readline')

const CommandSystem = function (accountManager) {
  EventEmitter.call(this)
  this.accountManager = accountManager
  this.commands = {}
  this.autoCommands = []
  this.delayedMessages = []
  this.isRunning = false
  this._registerDefaultCommands()
}

util.inherits(CommandSystem, EventEmitter)

CommandSystem.prototype._registerDefaultCommands = function () {
  const self = this
  
  this.registerCommand('say', (args, context) => {
    const message = args.join(' ')
    const delayMs = context.delayBetween || 0
    self.accountManager.say(message, delayMs)
    return `Message sent from all accounts with ${delayMs}ms delay between accounts`
  })
  
  this.registerCommand('say-account', (args, context) => {
    if (args.length < 2) return 'Usage: say-account <account> <message>'
    const account = args[0]
    const message = args.slice(1).join(' ')
    self.accountManager.sayWithFormat(account, message)
    return `Message sent from ${account}`
  })
  
  this.registerCommand('delay-say', (args, context) => {
    if (args.length < 2) return 'Usage: delay-say <delayMs> <message>'
    const delayMs = parseInt(args[0])
    const message = args.slice(1).join(' ')
    self.accountManager.say(message, delayMs)
    return `Message scheduled with ${delayMs}ms delay between accounts`
  })
  
  this.registerCommand('schedule', (args, context) => {
    if (args.length < 3) return 'Usage: schedule <delayMs> <intervalMs> <message>'
    const delayMs = parseInt(args[0])
    const intervalMs = parseInt(args[1])
    const message = args.slice(2).join(' ')
    
    setTimeout(() => {
      self.accountManager.say(message, delayMs)
    }, intervalMs)
    
    return `Message scheduled in ${intervalMs}ms`
  })
  
  this.registerCommand('status', () => {
    return JSON.stringify(self.accountManager.getStatus(), null, 2)
  })
  
  this.registerCommand('list-accounts', () => {
    const status = self.accountManager.getStatus()
    return `Connected accounts (${status.totalBots}): ${status.accounts.join(', ')}`
  })
  
  this.registerCommand('help', () => {
    const cmds = Object.keys(this.commands)
    return `Available commands: ${cmds.join(', ')}`
  })
}

CommandSystem.prototype.registerCommand = function (name, handler) {
  this.commands[name] = handler
  this.emit('command_registered', { name })
}

CommandSystem.prototype.executeCommand = function (input) {
  const parts = input.trim().split(/\s+/)
  const commandName = parts[0]
  const args = parts.slice(1)
  
  if (!this.commands[commandName]) {
    return `Command not found: ${commandName}. Type 'help' for available commands.`
  }
  
  try {
    const result = this.commands[commandName](args, { delayBetween: 500 })
    this.emit('command_executed', { command: commandName, success: true, result })
    return result
  } catch (err) {
    this.emit('command_executed', { command: commandName, success: false, error: err.message })
    return `Error executing command: ${err.message}`
  }
}

CommandSystem.prototype.startInteractiveTerminal = function () {
  const self = this
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  
  this.isRunning = true
  this.emit('terminal_started')
  
  console.log('\n=== Mineflayer Multi-Account Command System ==="')
  console.log('Type \'help\' for available commands')
  console.log('Type \'exit\' to quit\n')
  
  const promptUser = () => {
    rl.question('> ', (input) => {
      if (input.toLowerCase() === 'exit') {
        console.log('\nShutting down...')
        rl.close()
        self.isRunning = false
        self.emit('terminal_stopped')
        return
      }
      
      if (input.trim()) {
        const result = self.executeCommand(input)
        console.log(`\n${result}\n`)
      }
      
      promptUser()
    })
  }
  
  promptUser()
}

CommandSystem.prototype.addAutoCommand = function (commandInput, intervalMs) {
  const autoCmd = {
    id: Date.now(),
    command: commandInput,
    interval: intervalMs,
    lastExecuted: null
  }
  
  this.autoCommands.push(autoCmd)
  this.emit('auto_command_added', { id: autoCmd.id, command: commandInput })
  return autoCmd.id
}

CommandSystem.prototype.removeAutoCommand = function (commandId) {
  const index = this.autoCommands.findIndex(cmd => cmd.id === commandId)
  if (index > -1) {
    this.autoCommands.splice(index, 1)
    this.emit('auto_command_removed', { id: commandId })
    return true
  }
  return false
}

CommandSystem.prototype.startAutoCommands = function () {
  const self = this
  
  setInterval(() => {
    self.autoCommands.forEach(autoCmd => {
      const now = Date.now()
      if (!autoCmd.lastExecuted || (now - autoCmd.lastExecuted) >= autoCmd.interval) {
        const result = self.executeCommand(autoCmd.command)
        autoCmd.lastExecuted = now
      }
    })
  }, 1000)
}

CommandSystem.prototype.getScheduledMessages = function () {
  return this.delayedMessages
}

module.exports = CommandSystem
