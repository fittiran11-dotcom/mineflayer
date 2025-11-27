const EventEmitter = require('events').EventEmitter
const util = require('util')

const MultiAccountManager = function () {
  EventEmitter.call(this)
  this.bots = {}
  this.accounts = []
  this.commandQueue = []
  this.isProcessingCommands = false
}

util.inherits(MultiAccountManager, EventEmitter)

MultiAccountManager.prototype.addBot = function (bot, accountName) {
  if (!accountName) throw new Error('Account name is required')
  this.bots[accountName] = bot
  this.accounts.push(accountName)
  this.emit('bot_added', { name: accountName, bot })
}

MultiAccountManager.prototype.removeBot = function (accountName) {
  if (this.bots[accountName]) {
    delete this.bots[accountName]
    this.accounts = this.accounts.filter(acc => acc !== accountName)
    this.emit('bot_removed', { name: accountName })
  }
}

MultiAccountManager.prototype.getBot = function (accountName) {
  return this.bots[accountName]
}

MultiAccountManager.prototype.getAllBots = function () {
  return this.bots
}

MultiAccountManager.prototype.executeCommandOnAll = function (command, delayBetweenMs = 0) {
  const self = this
  return new Promise((resolve, reject) => {
    const results = {}
    const accounts = Object.keys(this.bots)
    let completed = 0

    if (accounts.length === 0) {
      resolve(results)
      return
    }

    accounts.forEach((accountName, index) => {
      setTimeout(() => {
        const bot = self.bots[accountName]
        try {
          const result = command(bot, accountName)
          results[accountName] = { success: true, result }
        } catch (err) {
          results[accountName] = { success: false, error: err.message }
        }
        completed++
        if (completed === accounts.length) {
          resolve(results)
        }
      }, index * delayBetweenMs)
    })
  })
}

MultiAccountManager.prototype.say = function (message, delayBetweenMs = 0) {
  return this.executeCommandOnAll((bot) => {
    bot.chat(message)
  }, delayBetweenMs)
}

MultiAccountManager.prototype.sayWithFormat = function (accountName, message) {
  const bot = this.bots[accountName]
  if (bot) {
    bot.chat(`[${accountName}] ${message}`)
  }
}

MultiAccountManager.prototype.executeCommandQueued = function (command, delayBetweenMs = 0) {
  this.commandQueue.push({ command, delayBetweenMs, timestamp: Date.now() })
  this._processCommandQueue()
}

MultiAccountManager.prototype._processCommandQueue = function () {
  const self = this
  if (this.isProcessingCommands || this.commandQueue.length === 0) return
  
  this.isProcessingCommands = true
  const task = this.commandQueue.shift()
  
  this.executeCommandOnAll(task.command, task.delayBetweenMs).then(() => {
    self.isProcessingCommands = false
    if (self.commandQueue.length > 0) {
      self._processCommandQueue()
    }
  })
}

MultiAccountManager.prototype.disconnect = function (accountName) {
  if (accountName && this.bots[accountName]) {
    this.bots[accountName].end()
    this.removeBot(accountName)
  } else {
    Object.keys(this.bots).forEach(acc => {
      this.bots[acc].end()
      this.removeBot(acc)
    })
  }
}

MultiAccountManager.prototype.getStatus = function () {
  return {
    totalBots: Object.keys(this.bots).length,
    accounts: this.accounts,
    queuedCommands: this.commandQueue.length,
    bots: Object.keys(this.bots).reduce((acc, name) => {
      const bot = this.bots[name]
      acc[name] = {
        username: bot.username,
        health: bot.health,
        isConnected: bot.isConnected,
        position: bot.entity.position
      }
      return acc
    }, {})
  }
}

module.exports = MultiAccountManager
