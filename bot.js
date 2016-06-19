const http = require('http');
const Client = require('./src/client');

let web_str = '';

let client = new Client();
client.on('ready', () => {
    client.setClientGame('WORLD DOMINATION');
});

client.on('server-created', (server) => {
    if (server.name === 'Ho-Bokes') {
        let web_str = 'Members online: ';
        client.guilds.get('name', 'Ho-Bokes').members.all('online', true).forEach(member => {
            web_str += member.username + ', ';
        });
        web_str = web_str.substring(0, web_str.length - 2);
    }
});

client.on('presence-updated', (old_user, new_user) => {
    // User entering/quitting game
    if (old_user.game && !new_user.game) {
        console.log(`${old_user.username} stopped playing ${old_user.game.name}`);
    }
    else if (!old_user.game && new_user.game) {
        console.log(`${new_user.username} started playing ${new_user.game.name}`);
    }
    // User coming online/going offline
    if (old_user.online && !new_user.online) {
        console.log(`${new_user.username} has logged off`);
    }
    else if (!old_user.online && new_user.online) {
        console.log(`${new_user.username} has come online`);
    }

});

client.on('message-created', message => {
    // Start of a command
    if (message.content[0] === "!") {
        let command = message.content.substring(1);
    }
});

client.on('voice-state-updated', (old_voicestate, new_voicestate, user, guild_id) => {
    // Check if user changed channel
    if (old_voicestate.channel_id !== new_voicestate.channel_id) {
        if(new_voicestate.channel_id !== null && new_voicestate.channel_id !== undefined){
            client.createMessage(guild_id, `${user.nick} has entered the voice channel`, true);
        }
        if(old_voicestate.channel_id !== null && old_voicestate.channel_id !== undefined){
            client.createMessage(guild_id, `${user.nick} has left the voice channel`, true);
        }
    }/* TODO: this does not trigger a voice state update i think
    // Check if user deafened him/herself
    if (!old_voicestate.self_deaf && new_voicestate.self_deaf) {
        client.createMessage(guild_id, `${user.nick} turned their sound off`, true);
    }
    // Check if user muted him/herself
    if (!old_voicestate.self_mute && new_voicestate.self_mute) {
        client.createMessage(guild_id, `${user.nick} has turned their microfone off`, true);
    }*/
});

client.login(process.env.BOT_ID);

// Heroku app page
const port = process.env.PORT || 9000;

var http_server = http.createServer((request, response) => {
    response.end(`There are no strings on me!\n\n${web_str}`);
});

http_server.listen(port, () => {
    console.log('Server listening on: http://localhost:%s', port);
});
