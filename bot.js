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
        console.log(`${new_user.name} has logged off`);
    }
    else if (!old_user.online && new_user.online) {
        console.log(`${new_user.name} has come online`);
    }

});

client.on('message-created', message => {
    let split_string = [];
    // Start of a command
    if (message.content[0] === "!") {
        let command = message.content.substring(1);
        split_string = command.split(" ");
    }
    // HOTS links
    if (split_string[0] === "heroesfire"){
        let link = `http://www.heroesfire.com/hots/wiki/heroes/${split_string[1]}`;
        client.createMessage(message.channel_id, link);
    }
    if (split_string[0] === "icyveins"){
        let link = `http://www.icy-veins.com/heroes/${split_string.slice(1).join("-")}-build-guide`;
        client.createMessage(message.channel_id, link);
    }
});

client.on('voice-state-updated', (old_voicestate, new_voicestate, user, guild_id) => {
    let entermessage = `${user.name} has entered the voice channel`;
    let leavemessage = `${user.name} has left the voice channel`;
    if (isUser(user, "Arno")){
        entermessage = "A wild fag appeared";
        leavemessage = "Good riddance";
    }
    else if (isUser(user, "Tristan")){
        entermessage = "God has arrived";
        leavemessage = `We weep at your departure ${user.name}`;
    }
    else if (isUser(user, "Sten")){}
    else if (isUser(user, "Beau")){}
    else if (isUser(user, "Mitchell")){
        entermessage = "RAGE INCOMING";
    }

    // Check if user changed channel
    if (old_voicestate.channel_id !== new_voicestate.channel_id) {
        if (new_voicestate.channel_id !== null && new_voicestate.channel_id !== undefined){
            client.createMessage(guild_id, entermessage, true);
        }
        if (old_voicestate.channel_id !== null && old_voicestate.channel_id !== undefined){
            client.createMessage(guild_id, leavemessage, true);
        }
    }
});

function isUser(user, name) {
    if (name === "Arno"){ return user.username === "Nintenrax" && user.discriminator === "3078"; }
    else if (name === "Tristan"){ return user.username === "tristanvandeputte" && user.discriminator === "6353"; }
    else if (name === "Sten"){ return user.username === "Mezzo" && user.discriminator === "9210"; }
    else if (name === "Beau"){ return user.username === "Void" && user.discriminator === "2721"; }
    else if (name === "Mitchell"){ return user.username === "SunlightHurtsMe" && user.discriminator === "2587"; }
    // Rest of ppls
}

client.login(process.env.BOT_ID);

// Heroku app page
const port = process.env.PORT || 9000;

var http_server = http.createServer((request, response) => {
    response.end(`There are no strings on me!\n\n${web_str}`);
});

http_server.listen(port, () => {
    console.log('Server listening on: http://localhost:%s', port);
});
