// client side js
const socket = io()

// elements - $ prefix means element from DOM
// send message DOM elements
const $msgForm = document.querySelector('#message-form')
const $msgFormInput = $msgForm.querySelector('input')
const $msgFormBtn = $msgForm.querySelector('button')

// send location DOM elements
const $sendLocationBtn = document.querySelector('#send-location')

// where the messages will go in the DOM
const $messages = document.querySelector('#messages')

// templates - using innerHTML to get whats inside of the div
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// options - parse the query string, and ignore the '?' prefix in query string
// query string returns an object with username and room, so can be destructured
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true})

// autoscroll feed if user is currently looking at latest messages
const autoscroll = () => {
    // grab new message element and its height + its bottom margin
    const $newMessage = $messages.lastElementChild
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // get visible height
    const visibleHeight = $messages.offsetHeight

    // get height of messages container by getting total height we can scroll through
    // and how far we have scrolled down 
    const containerHeight = $messages.scrollHeight
    const scrollOffset = $messages.scrollTop + visibleHeight

    // check if we are scrolled to the bottom before the message was sent 
    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight // this will push screen to the bottom 
    }
        
    // const element = $newMessage.lastElementChild
    // element.scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"})
}

// event listener for a message
socket.on('message', (message) => {
    console.log(message)
    // stores final html we want to render in browser
    const html = Mustache.render(messageTemplate, { 
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    // beforeend will render new messages below current html
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

// event listener for location message where username and url is passed
socket.on('locationMessage', (message) => {
    console.log(message)
    const html = Mustache.render(locationTemplate, { 
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

// event listener to transfer data after a user joins/leaves a room
socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    // render html above inside the sidebar div 
    document.querySelector('#sidebar').innerHTML = html
})

// event listener to send a message
$msgForm.addEventListener('submit', (e) => {
    e.preventDefault()

    $msgFormBtn.setAttribute('disabled', 'disabled')

    const message = e.target.elements.message.value
    // third param is event acknowledgement, use callback on socket.on event listener
    // to catch the acknowledgment
    socket.emit('sendMessage', message, (error) => {
        // re-enable, reset then refocus onto form after message is sent
        $msgFormBtn.removeAttribute('disabled')
        $msgFormInput.value = ''
        $msgFormInput.focus()

        // check if any errors come up in index.js
        if (error) {
          return console.log(error)  
        }

        console.log('Message delivered')
    })
})

// event listener to send a location using geolocation API
$sendLocationBtn.addEventListener('click', () => {
    $sendLocationBtn.setAttribute('disabled', 'disabled')
    
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser.')
    }

    navigator.geolocation.getCurrentPosition((position) => { 
        socket.emit('sendLocation', { 
            latitude: position.coords.latitude, 
            longitude: position.coords.longitude 
        }, () => {
            $sendLocationBtn.removeAttribute('disabled')
            console.log('Location shared.')
        })
    })
})

// emit an event for user to join a room
socket.emit('join', { username, room }, (error) => {
    // handle any errors in the client-side, if there 
    // are any errors, redirect to root page
    if (error) {
        alert(error)
        location.href = '/'
    }
})
