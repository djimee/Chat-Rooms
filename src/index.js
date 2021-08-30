// server side js
const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

// N.B we refactor to use a server, to pass into socket.io
const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000 

// define paths for Express config
const publicDirectoryPath = path.join(__dirname, ('../public'))

// setup static directory to serve
app.use(express.static(publicDirectoryPath))

io.on('connection', (socket) => {
    console.log('New WebSocket connection!')

    // send data to the client with text and timestamp and broadcast new user
    socket.on('join', ({ username, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room })
        
        // check if there is an error, run callback and terminate call if so
        if (error) {
            return callback(error)
        }
        
        // we use user object because of its data is sanitised i.e user.room not room
        socket.join(user.room) 

        // emit and broadcast welcome messages to relevant users/rooms
        socket.emit('message', generateMessage('Admin', 'Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`))
        
        // update the users in the room to update the sidebar
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        // run callback with no error if user joins successfully
        callback()
    })

    // send a message by emitting the message
    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id) 
        const filter = new Filter()
        // check for profanity in the message
        if (filter.isProfane(message)) {
            return callback('Watch yo profanity!')
        }

        // send message and users username
        io.to(user.room).emit('message', generateMessage(user.username, message))
        
        // runs the event acknowledgement
        callback()
    })

    // send current user location using google maps link
    socket.on('sendLocation', (coords, callback) => {
        // get the user and send out location message
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${coords.latitude},${coords.longitude}`))
        callback()
    })

    // emit a message to let clients know a client has disconnected
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        // if user exists, disconnect user, emit messages to relevant rooms and update room users list to update sidebar
        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

// listen to server on given port
server.listen(port, () => {
    console.log(`Server running on port ${port}`)
})
