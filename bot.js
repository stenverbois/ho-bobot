let Client = require('./src/client')

let client = new Client()
client.on('ready', () => {
    client.setClientGame("WORLD DOMINATION")
})
client.login("MTkxNTc3NDYwOTI2NTc4Njg5.Cj8T6g.thz8gHSZ1JNNJXHkjJnhgpXXmNM")
