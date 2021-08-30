// generate a message given username and text, and generate a date using moment js
const generateMessage = (username, text) => {
    return {
        username,
        text,
        createdAt: new Date().getTime()
    }
}

// generate a location message given username and text, and generate a date using moment js
const generateLocationMessage = (username, url) => {
    return {
        username,
        url,
        createdAt: new Date().getTime()
    }
}

module.exports = { 
    generateMessage,
    generateLocationMessage
}
