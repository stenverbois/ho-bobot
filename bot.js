const http = require('http');
const Client = require('./src/client');

let web_str = '';

let client = new Client();
client.on('ready', () => {
    client.setClientGame('WORLD DOMINATION');
});

client.on('server-created', (server) => {
    if(server.name === 'Ho-Bokes') {
        let web_str = 'Members online: ';
        client.guilds.all().forEach(server => {
            console.log('NAME ' + server.name);
        });
        client.guilds.get('name', 'Ho-Bokes').members.all('online', true).forEach(member => {
            web_str += member.username + ', ';
        });
        web_str = web_str.substring(0, web_str.length - 2);
    }
});

client.login('MTkxNTc3NDYwOTI2NTc4Njg5.Cj8T6g.thz8gHSZ1JNNJXHkjJnhgpXXmNM');

// Heroku app page
const port = process.env.PORT || 9000;

var http_server = http.createServer((request, response) => {
    response.end(`There are no strings on me!\n\n${web_str}`);
});

http_server.listen(port, () => {
    console.log('Server listening on: http://localhost:%s', port);
});
