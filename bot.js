// Load .env configuration
require('dotenv').config();

const http = require('http');
const semver = require('semver');

const Client = require('./src/client');
const quotes = require('./src/quotes');
const commands = require('./commands');
const Changelog = require('./CHANGELOG');

let web_str = '';

function versionToPatchNotes(version) {
    let patch_str = `**${version.version}**:
_Date_: ${version.date}
_Changes_:\n`;

    version.changes.forEach(change => {
        patch_str += `\t- ${change}\n`;
    });

    return patch_str;
}

let client = new Client();
client.on('ready', () => {
    // client.setClientGame('WORLD DOMINATION');
});

client.on('server-created', (server) => {
    if (server.name === 'Ho-Bokes') {
        // Print missing changelogs to the hobobot-changelog channel
        client.getMessages(server.channels.get("name", "hobobot-changelog").id, 1).then(messages => {
            let last_patch = messages[0].content;
            let version = "";
            if (last_patch.startsWith("**v")) {
                version = last_patch.split('\n')[0].replace(/\*|:/g, "");
            }
            Changelog.versions.forEach(v => {
                if (!semver.valid(version) || semver.gt(v.version, version)) {
                    client.createMessage(server.channels.get("name", "hobobot-changelog").id, versionToPatchNotes(v));
                }
            });
        });

    }
    client.joinVoiceChannel(server.channels.get("name", "General"));
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
    // Start of a command
    if (message.content[0] === '!') {
        let split_string = message.content.split(' ');
        let command = split_string[0].substring(1);
        let args = split_string.slice(1);
        if (quotes.isUser(message.author, "Arno") && Math.random() > 0.9) {
            client.createMessage(message.channel_id, `Arno used '${command}', it's not very effective...`);
            return;
        }

        if (commands[command]) {
            commands[command].process(client, message, args).catch(err => {
                client.createMessage(message.channel_id, "Oops, something went wrong while executing your command. ¯\\_(ツ)_/¯\n");
            });
        }
        else {
            client.createMessage(message.channel_id, `\`${command}\`is not a valid command, ${message.author.name}. Check \`!commands\` for a list of existing commands.`);
        }
    }
});

client.on('voice-state-updated', (old_voicestate, new_voicestate, user, guild_id) => {
    let new_is_channel = new_voicestate.channel_id !== null && new_voicestate.channel_id !== undefined;
    let old_was_channel = old_voicestate.channel_id !== null && old_voicestate.channel_id !== undefined;

    // Check if user entered/left voice chat
    if (!old_was_channel && new_is_channel) {
        client.createMessage(guild_id, quotes.giveEntryQuoteFor(user), true).then(msg => {
            msg.delete();
        });
    }
    else if (old_was_channel && !new_is_channel) {
        client.createMessage(guild_id, quotes.giveLeavingQuoteFor(user), true).then(msg => {
            msg.delete();
        });
    }
});

client.login(process.env.BOT_TOKEN);

// Heroku app page
const port = process.env.PORT || 9001;

var http_server = http.createServer((request, response) => {
    response.end(`There are no strings on me!\n\n${web_str}`);
});

http_server.listen(port, () => {
    console.log('Server listening on: 0.0.0.0:%s', port);
});
