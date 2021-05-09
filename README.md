# room.io-client

Client utility for the [room.io](https://github.com/oni0nknight/room.io) framework.

[![Version npm](https://img.shields.io/npm/v/room.io-client.svg?style=flat)](https://www.npmjs.com/package/room.io-client) [![npm Downloads](https://img.shields.io/npm/dm/room.io-client.svg?style=flat)](https://npmcharts.com/compare/room.io-client?minimal=true) [![Dependencies](https://img.shields.io/david/oni0nknight/room.io-client)](https://david-dm.org/oni0nknight/room.io-client)


## Installation

```bash
# with npm
npm install room.io-client

# with yarn
yarn add room.io-client
```

## Quick Start

Make sure you have a [`room.io`](https://github.com/oni0nknight/room.io) server running.

```js
const { createClient } = require('room.io-client')

// Create your room.io client
const client = createClient()

// Create a room with this client, that other players will be able to join
client.createRoom('player1', { avatar: 'avatar-1' })
```

## Features

### Player

A player is represented by a name and an optional data object.
You can use your `room.io` client instance to update the player name and data with the `setPlayer` method.

| Name              | Description     |
| ----------------- | --------------- |
| `setPlayer`       | Update the player name and data. Pass the new name and data as parameters |

The data object can represent anything you want, and can be omitted if not used by your game.

> *Note:* players must be in a room before calling `setPlayer`.

### Room

A room is represented by 3 attributes:
- a list of players. Note that the room creator is called the room *host*
- a room code used to join the room
- an optional settings object
Your client instance can perform a few actions related to room management:

| Name              | Description     |
| ----------------- | --------------- |
| `createRoom`      | Create a room. Pass the player name and data as parameters |
| `joinRoom`        | Join an existing room. Pass the room code and the player name and data as parameters |
| `leaveRoom`       | Leave the player's current room |
| `getRoom`         | Get the room data |
| `setRoomSettings` | Update the room settings |

> *Note:* rooms are automatically destroyed by the server.

### Game

Your client instance exposes the `startGame` method that is used to start the game in the player room.

| Name              | Description     |
| ----------------- | --------------- |
| `startGame`       | Start the game in the room |

> *Note:* only the room host can start the game in the room.


## API

### Create a room.io client

`room.io-client` exposes a single `createClient` function. Calling it with a configuration object returns a `room.io` client instance that you use to interract with your `room.io` server.

```js
const { createClient } = require('room.io-client')

// Create your room.io client
const client = createClient({
    serverUrl: 'http://localhost:8080'
})
```

`serverUrl` (Optional)  
Url of your `room.io` server. Note that you can omit it completely if your client code is served by the same server (i.e. same origin).


### Built-in actions

`room.io-client` comes with 7 built-in actions. They all return a Promise that resolves when the action is performed on the server, and rejects if an error is returned by the server. Built-in `room.io` errors are always in the form `{ code: 'err_xxx' }`. See [errors](#errors) for a full list of `room.io` errors.

- `createRoom` is used to create a room and register as the host player. Pass the player name and data as parameters.
```js
client.createRoom('player1', { customAttribute: 'value' })

// Game without player custom data
client.createRoom('player1')
```

- `joinRoom` is used to join an existing room and register as a player. Pass the player name and data as parameters.
```js
client.joinRoom('E6A2FD', 'player2', { customAttribute: 'otherValue' })

// Game without player custom data
client.joinRoom('E6A2FD', 'player2')
```

- `leaveRoom` is used to leave the current player's room.
```js
client.leaveRoom()
```

- `getRoom` is used to request the current room data.
```js
client.getRoom().then((roomData) =>
{
    const {
        code, // The room 6-digits code
        isHost, // Boolean. true if the caller is the host of the room.
        players, // Array of players in the room, in the form { name, data, publicId }
        settings // Settings object of the room
    } = roomData
})
```

- `setRoomSettings` is used to update the room settings. Only the room host can perform this action.
```js
const newSettings = { useExtension: true, lifeCount: 3 }
client.setRoomSettings(newSettings)
```

- `setPlayer` is used to update the player name and data. Can only be performed after the player is in a room.
```js
client.setPlayer('player3', { customAttribute: 'value2' })
```

- `startGame` is used to start the game in the room. Only the room host can perform this action.
```js
client.startGame()
```

### Custom game actions

Use the `query` method to send any event to your `room.io` server. Such events are called game actions and should be declared in the server configuration so that your game can react to them.

`query` returns a Promise that resolves when the action is performed on the server (you can also send data back from the server), and rejects if an error is returned by the server.

```js
const targetPlayerId = getTargetPlayerId()
client.query('sendMoney', { to: targetPlayerId, amount: '$5' })
```

### Subscribes

You can subscribe/unsubscribe to any event sent by the `room.io` server by calling the `subscribe` and `unsubscribe` methods. You can subscribe several times to the same event and pass different callbacks.

```js
function onMoneyReceived({ amount, from }) =>
{
    // callback
}

// subscribe to a 'moneyReceived' event
client.subscribe('moneyReceived', onMoneyReceived)

// unsubscribe to the 'moneyReceived' event
client.subscribe('moneyReceived', onMoneyReceived)
```

#### built-in `room.io` events

There are 6 built-in events that are sent by the `room.io` server. You can subscribe to them with the same `subscribe` and `unsubscribe` methods.

- `roomUpdated` is fired whenever a change occurs in the player room (players or room settings).
> *Notes:*
>- It is only fired **before** the game has started.
>- It doesn't contain the room data. You have to call `getRoom` to get the updated room data.
```js
client.subscribe('roomUpdated', () =>
{
    refreshRoom()
})
```

- `roomDestroyed` is fired to all room players after the host leaves the room. When this event is sent, the room just got destroyed on the server so all players must join or create another room.
> *Note:* it is only fired **before** the game has started. If the a player (host or not) leaves the game after it has started, the game continues normally as players can then reconnect.
```js
client.subscribe('roomDestroyed', () =>
{
    goBackToHome()
})
```

- `gameStarted` is fired to all room players when the host starts the game.
```js
client.subscribe('gameStarted', () =>
{
    startGameUI()
})
```

- `playerLeft` is fired to all room players when a player leaves the room. The payload contains the leaver `publicId` and `name`.
> *Note:* it is only fired **after** the game has started, when any player leaves the room.
```js
client.subscribe('playerLeft', ({ publicId, name }) =>
{
    displayNotification(`${name} left the room`)
})
```

- `playerRejoined` is fired to all room players when a player rejoins the room (after having left it). The payload contains the player `publicId` and `name`.
> *Note:* it is only fired **after** the game has started, when a player rejoins the room.
```js
client.subscribe('playerRejoined', ({ publicId, name }) =>
{
    displayNotification(`${name} rejoined the room`)
})
```

- `reconnected` is fired just after calling the `createClient` function if the player rejoins the room after having left it. It is sent at the same time than `playerRejoined` but only to the player that is rejoining. You can use this callback to detect a reconnection in your game logic.
> *Note:* it is only fired **after** the game has started.
```js
client.subscribe('reconnected', () =>
{
    displayNotification(`you just rejoined the game. Other players missed you.`)
})
```

#### `error` subscribe

`error` is a particular event that you can subscribe to as any other event. The callbacks you register for this event are then called whenever the `room.io` server sends any error back (built-in errors as well as your custom game action errors). This can be used to build a notification center for instance, that would display certain errors to the player.

### Errors

Below are listed all `room.io` built-in errors:

| Code           | Description     | Sent by         |
| -------------- | --------------- | --------------- |
| `err_100`      | already in a room | `createRoom`, `joinRoom` |
| `err_101`      | not in a room | `leaveRoom`, `getRoom`, `setPlayer`, `setRoomSettings`, `startGame`, any custom game action |
| `err_102`      | room not found | `joinRoom` |
| `err_103`      | room is full | `joinRoom` |
| `err_104`      | game already started | `joinRoom`, `setPlayer`, `startGame` |
| `err_105`      | game not started | any custom game action |
| `err_106`      | you are not the host | `setRoomSettings`, `startGame` |
| `err_107`      | wrong player count | `startGame` |
| `err_108`      | missing callback | any custom game action |
| `err_109`      | incompatible settings | `startGame` |
| `err_200`      | invalid player name | `createRoom`, `joinRoom`, `setPlayer` |
| `err_201`      | invalid player data | `createRoom`, `joinRoom`, `setPlayer` |
| `err_202`      | invalid room code | `joinRoom` |
| `err_203`      | invalid room settings | `setRoomSettings` |
| `err_204`      | invalid input payload | any custom game action |

> *Notes:*
> - `err_108` should only be received while in development. It indicates that you are requesting a custom game action to the server (with the `query` method), but you did not declare this action in the server configuration.
> - `err_204` is sent back as an error for any custom game action if the payload sent to the server is refused by your input-validator function. Read more about input-validators in the [`room.io` documentation](https://github.com/oni0nknight/room.io#server-configuration)

## License

[MIT](LICENSE)
