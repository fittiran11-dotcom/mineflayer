const net = require('net')
const EventEmitter = require('events').EventEmitter
const util = require('util')

const ProxyManager = function () {
  EventEmitter.call(this)
  this.proxies = {}
  this.accountProxyMap = {}
  this.proxyRotationIndex = {}
}

util.inherits(ProxyManager, EventEmitter)

ProxyManager.prototype.addProxy = function (proxyName, host, port, username, password) {
  this.proxies[proxyName] = {
    host,
    port,
    username,
    password,
    scheme: `http://${username ? username + ':' + password + '@' : ''}${host}:${port}`
  }
  this.emit('proxy_added', { name: proxyName })
}

ProxyManager.prototype.removeProxy = function (proxyName) {
  if (this.proxies[proxyName]) {
    delete this.proxies[proxyName]
    this.emit('proxy_removed', { name: proxyName })
  }
}

ProxyManager.prototype.assignProxyToAccount = function (accountName, proxyName) {
  if (!this.proxies[proxyName]) throw new Error(`Proxy ${proxyName} not found`)
  this.accountProxyMap[accountName] = proxyName
  this.emit('proxy_assigned', { account: accountName, proxy: proxyName })
}

ProxyManager.prototype.getProxyForAccount = function (accountName) {
  return this.accountProxyMap[accountName]
}

ProxyManager.prototype.getProxyConfig = function (proxyName) {
  return this.proxies[proxyName]
}

ProxyManager.prototype.rotateProxyForAccount = function (accountName) {
  const proxyNames = Object.keys(this.proxies)
  if (proxyNames.length === 0) return null
  
  if (!this.proxyRotationIndex[accountName]) {
    this.proxyRotationIndex[accountName] = 0
  }
  
  const nextProxy = proxyNames[this.proxyRotationIndex[accountName]]
  this.proxyRotationIndex[accountName] = (this.proxyRotationIndex[accountName] + 1) % proxyNames.length
  
  this.assignProxyToAccount(accountName, nextProxy)
  return nextProxy
}

ProxyManager.prototype.getProxyUrl = function (proxyName) {
  const proxy = this.proxies[proxyName]
  if (!proxy) return null
  return proxy.scheme
}

ProxyManager.prototype.getAllProxies = function () {
  return Object.keys(this.proxies).map(name => ({
    name,
    ...this.proxies[name]
  }))
}

ProxyManager.prototype.getStatus = function () {
  return {
    totalProxies: Object.keys(this.proxies).length,
    proxies: this.getAllProxies(),
    accountProxyMap: this.accountProxyMap
  }
}

ProxyManager.prototype.parseProxyString = function (proxyString) {
  const match = proxyString.match(/(?:http:\/\/)?(?:([^:]+):([^@]+)@)?([^:]+):(\d+)/)
  if (!match) throw new Error('Invalid proxy string format')
  
  return {
    username: match[1],
    password: match[2],
    host: match[3],
    port: parseInt(match[4])
  }
}

module.exports = ProxyManager
