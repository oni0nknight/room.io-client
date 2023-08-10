import { io } from 'socket.io-client'

const QUERY_TIMEOUT = 5000


export class Client
{
    //=====================
    // Public attributes
    //=====================

    /**
     * socket.io object
     * @type {Socket}
     */
    socket = null

    /**
     * The player public ID
     * @type {(string|null)}
     */
    publicId = null

    //=====================
    // Private attributes
    //=====================

    /**
     * The list of error callbacks
     * @type {Function[]}
     */
    #errorCbs = []

    //=====================
    // Constructor
    //=====================

    constructor({ serverUrl = null } = {})
    {
        this.socket = this.#createSocket(serverUrl)
    }

    //=====================
    // Private methods
    //=====================

    #createSocket(serverUrl)
    {
        const options = {
            transports: ['websocket'],
            query: {
                playerID: localStorage.getItem('playerID')
            }
        }
        const socket = serverUrl ? io(serverUrl, options) : io(options)

        // Bind basic events
        //------------------

        socket.on('registered', (publicId) => {
            localStorage.setItem('playerID', this.socket.id)
            this.publicId = publicId
        })

        return socket
    }

    //=====================
    // Public methods
    //=====================

    query(eventName, args)
    {
        return new Promise((resolve, reject) => {
            let timeout = 0

            const handleResponse = (result) => {
                this.unsubscribe(eventName + '_response', handleResponse)
                this.unsubscribe(eventName + '_error', handleError)
                clearTimeout(timeout)
                resolve(result)
            }
            const handleError = (error) => {
                this.unsubscribe(eventName + '_response', handleResponse)
                this.unsubscribe(eventName + '_error', handleError)
                clearTimeout(timeout)
                this.#errorCbs.forEach((errorCb) =>
                {
                    if (errorCb instanceof Function)
                    {
                        errorCb(error)
                    }
                })
                reject(error)
            }

            // subscribe to response handler
            this.subscribe(eventName + '_response', handleResponse)
            this.subscribe(eventName + '_error', handleError)

            // emit the query
            this.socket.emit(eventName, args)

            // handle timeout
            timeout = setTimeout(() => handleError({ code: 'timeout' }), QUERY_TIMEOUT)
        })
    }

    subscribe(eventName, callback)
    {
        if (callback instanceof Function)
        {
            this.socket.on(eventName, callback)

            // Error callback
            if (eventName === 'error')
            {
                this.#errorCbs.push(callback)
            }
        }
    }

    unsubscribe(eventName, callback)
    {
        this.socket.off(eventName, callback)

        // Error callback
        if (eventName === 'error')
        {
            this.#errorCbs = this.#errorCbs.filter(cb => cb !== callback)
        }
    }

    createRoom({ playerName, playerData, roomSettings })
    {
        return this.query('createRoom', {
            playerName,
            playerData,
            roomSettings
        })
    }

    joinRoom({ playerName, playerData, roomCode })
    {
        return this.query('joinRoom', {
            playerName,
            playerData,
            roomCode
        })
    }

    leaveRoom()
    {
        return this.query('leaveRoom')
    }

    getRoom()
    {
        return this.query('getRoom')
    }

    setPlayer({ playerName, playerData })
    {
        return this.query('setPlayer', { playerName, playerData })
    }

    setRoomSettings(roomSettings)
    {
        return this.query('setRoomSettings', roomSettings)
    }

    startGame()
    {
        return this.query('startGame')
    }

}
