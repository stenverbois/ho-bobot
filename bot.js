let Client = require('./src/client')

let client = new Client()
client.on('ready', () => {
    client.setClientGame("WORLD DOMINATION")
})

client.login("MTkxNTc3NDYwOTI2NTc4Njg5.Cj8T6g.thz8gHSZ1JNNJXHkjJnhgpXXmNM")

// Heroku app setup
var http = require('http');
let port = process.env.PORT || 9000

var server = http.createServer((request, response) => {
    response.end('There are no strings on me!');
})

server.listen(port, () => {
    console.log("Server listening on: http://localhost:%s", port);
})
