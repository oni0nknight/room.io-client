const { Client } = require('./lib/Client')

/**
 * @typedef {Object} ClientConfig
 * @property {string} [serverUrl] The server location
 * @property {Function} [onError] Callback fired when the server sends an error
 */

/**
 * Create and return a Client instance
 * @param {ClientConfig} config config object for the client
 * @returns {Client} an instance of Server
 */
export function createClient(config)
{
    /**
     * Create the Client instance
     * @type {Client}
     */
    const client = new Client(config)

    return client
}

module.exports = {
    createClient
}