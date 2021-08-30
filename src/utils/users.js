const users = []

// add a user given id, username and room
const addUser = ({ id, username, room }) => {
    // sanitise data
    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()

    // validate data by checking if the user and room is given
    if (!username || !room) {
        return {
            error: 'Username and room are both required!'
        }
    }

    // check for an existing user, throw an error if it is
    const existingUser = users.find((user) => {
        return user.room === room && user.username === username
    })

    if (existingUser) {
        return {
            error: 'Username is already in use!'
        }
    }

    // store user in users array
    const user = { id, username, room }
    users.push(user)
    return { user }
}

// remove a user by id
const removeUser = (id) => {
    const index = users.findIndex((user) => user.id === id)

    // if a match is found
    if (index !== -1) {
        // N.B splice() returns an array of items we remove, 
        // we only remove 1 so we just want the first element of the array
        return users.splice(index, 1)[0] 
    }
}

// get a user by their id 
const getUser = (id) => {
    return users.find(user => user.id === id)
}

// get an array of the users currently in a room
const getUsersInRoom = (room) => {
    room = room.trim().toLowerCase()
    return users.filter(user => user.room === room)
}

module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}
