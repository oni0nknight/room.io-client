const Client = require('./lib/Client')

/**
 * Create and return a Client instance
 * @param {ClientConfig} config config object for the client
 * @returns {Client} an instance of Server
 */
function createClient(config)
{
    /**
     * Create the Client instance
     * @type {Client}
     */
    const client = new Client(config)

    // Bind the events
    client.bindEvents()

    return client
}

module.exports = {
    createClient
}