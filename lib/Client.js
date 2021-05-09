import { io } from 'socket.io-client'

const QUERY_TIMEOUT = 5000


export function Client({
    serverUrl = null
} = {})
{
    // Private variables
    //---------------------------

    /**
     * The list of error callbacks
     * @type {Array.<Function>}
     */
    const errorCbs = []

    
    // Private methods
    //---------------------------

    const createSocket = () =>
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


    // Public variables
    //---------------------------

    /**
     * socket.io object
     * @type {io.Server}
     */
    this.socket = createSocket()

    /**
     * The player public ID
     * @type {(string|null)}
     */
    this.publicId = null


    // Public methods
    //---------------------------

    this.query = (eventName, args) =>
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
                errorCbs.forEach((errorCb) =>
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

    this.subscribe = (eventName, callback) =>
    {
        if (callback instanceof Function)
        {
            this.socket.on(eventName, callback)

            // Error callback
            if (eventName === 'error')
            {
                errorCbs.push(callback)
            }
        }
    }

    this.unsubscribe = (eventName, callback) =>
    {
        this.socket.off(eventName, callback)

        // Error callback
        if (eventName === 'error')
        {
            errorCbs = errorCbs.filter(cb => cb !== callback)
        }
    }

    this.createRoom = (playerName, playerData) =>
    {
        return this.query('createRoom', {
            name: playerName,
            data: playerData
        })
    }

    this.joinRoom = (roomCode, playerName, playerData) =>
    {
        return this.query('joinRoom', {
            name: playerName,
            data: playerData,
            code: roomCode
        })
    }

    this.leaveRoom = () =>
    {
        return this.query('leaveRoom')
    }

    this.getRoom = () =>
    {
        return this.query('getRoom')
    }

    this.setPlayer = (playerName, playerData) =>
    {
        return this.query('setPlayer', {
            name: playerName,
            data: playerData
        })
    }

    this.setRoomSettings = (settings) =>
    {
        return this.query('setRoomSettings', settings)
    }

    this.startGame = () =>
    {
        return this.query('startGame')
    }

}
