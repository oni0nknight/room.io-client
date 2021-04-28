import { io } from 'socket.io-client'

const QUERY_TIMEOUT = 5000

export function Client({
    serverUrl,
    onError = () => null,
    onRoomUpdated = () => null,
    roomDestroyed = () => null,
    onGameStarted = () => null,
    onPlayerLeft = () => null,
    onPlayerRejoined = () => null
})
{
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


    // Private variables
    //---------------------------

    /**
     * List of active subscriptions
     * @type {Array}
     */
    const activeSubscriptions = []

    /**
     * Is the client trying to reconnect from a previous game
     * @type {Boolean}
     */
    const isReconnecting = false


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
                if (onError instanceof Function)
                {
                    onError(error)
                }
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
        if (callback instanceof Function) {
            this.socket.on(eventName, callback)
            activeSubscriptions.push({ eventName, callback })
        }
    }

    this.unsubscribe = (eventName, callback) =>
    {
        this.socket.off(eventName, callback)
        const idx = activeSubscriptions.findIndex(actsub => (actsub.eventName === eventName && actsub.callback === callback))
        if (idx !== -1) {
            activeSubscriptions.splice(idx, 1)
        }
    }

    this.createRoom = (playerName, playerData) =>
    {
        return this.query('createRoom', {
            name: playerName,
            data: playerData
        })
    }

    this.joinRoom = (playerName, playerData, roomCode) =>
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

        socket.on('reconnection', () => {
            isReconnecting = true
        })

        if (onError instanceof Function)
        {
            socket.on('err', onError)
        }
        if (onRoomUpdated instanceof Function)
        {
            socket.on('roomUpdated', onRoomUpdated)
        }
        if (roomDestroyed instanceof Function)
        {
            socket.on('roomDestroyed', roomDestroyed)
        }
        if (onGameStarted instanceof Function)
        {
            socket.on('gameStarted', onGameStarted)
        }
        if (onPlayerLeft instanceof Function)
        {
            socket.on('playerLeft', onPlayerLeft)
        }
        if (onPlayerRejoined instanceof Function)
        {
            socket.on('playerRejoined', onPlayerRejoined)
        }

        return socket
    }

}
