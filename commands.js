const ytdl = require('ytdl-core');

function msToTime(s) {
  let ms = s % 1000;
  s = (s - ms) / 1000;
  let secs = s % 60;
  s = (s - secs) / 60;
  let mins = s % 60;
  s = (s - mins) / 60;
  let hrs = s % 24;
  let days = (s - hrs) / 24;

  let time_str = `${secs} seconds.`;
  if (mins) {
      time_str = `${mins} minutes and ` + time_str;
  }
  if (hrs) {
      time_str = `${hrs} hours ` + time_str;
  }
  if (days) {
      time_str = `${days} days ` + time_str;
  }

  return time_str;
}

let command_data = {
    "uptime": {
        doc: "How much time I have been online for",
        process: (client, message) => {
            return client.createMessage(message.channel_id, `I have been ruling this server for ${msToTime(client.uptime())}`);
        }
    },
    "commands": {
        doc: "List all available commands",
        process: (client, message) => {
            let commands_str = "";
            for (let c in module.exports) {
                let command = module.exports[c];
                if (!command.private) {
                    commands_str += `${command.usage}\n`;
                }
            }
            return client.createMessage(message.channel_id, commands_str);
        }
    },
    "music": {
        args: [
            { type: "subcommand", oneof: [
                { name: "play", args: [ { name: "Youtube link" } ] },
                { name: "stop" },
                { name: "pause" }
            ]},
        ],
        doc: "Music controls",
        process: (client, message, args) => {
            return new Promise((resolve, reject) => {
                switch(args[0]) {
                    case "play":
                        ytdl.getInfo(args[1], (err, info) => {
                            if (err) {
                                console.error("Error in !music:", err);
                            }
                            // `info` is a list of all possible formats this video exists in
                            let audio_formats = info.formats.filter(i => i.type && i.type.indexOf('audio/') > -1);
                            let selection = audio_formats.reduce((pv, cv) => pv.audioBitrate > cv.audioBitrate ? pv : cv);
                            client.voice_connection.play(selection.url);
                        });
                        break;
                    case "stop":
                        client.voice_connection.stop();
                        break;
                    case "pause":
                        break;
                }
                resolve();
            });
        }
    },
    "hots": {
        args: [
            { name: "hero" }
        ],
        doc: "View HotS build for <hero> on icy-veins.com and heroesfire.com",
        process: (client, message, args) => {
            return new Promise((resolve, reject) => {
                if (args[0].toLowerCase() === "murky") {
                    client.createMessage(message.channel_id, "Fuck Murky", true);
                    return;
                }
                let m1 = client.createMessage(message.channel_id, `http://www.icy-veins.com/heroes/${args.join('-')}-build-guide \n`);
                let m2 = client.createMessage(message.channel_id, `http://www.heroesfire.com/hots/wiki/heroes/${args.join('-')}`);
                return Promise.all([m1, m2]);
            });
        }
    },
    "heroesfire": {
        args: [
            { name: "hero" }
        ],
        doc: "View HotS build for <hero> on heroesfire.com",
        process: (client, message, args) => {
            return client.createMessage(message.channel_id, `http://www.heroesfire.com/hots/wiki/heroes/${args.join('-')}`);
        }
    },
    "icyveins": {
        args: [
            { name: "hero" }
        ],
        doc: "View HotS build for <hero> on icy-veins.com",
        process: (client, message, args) => {
            return client.createMessage(message.channel_id, `http://www.icy-veins.com/heroes/${args.join('-')}-build-guide`);
        }
    },
    "test": {
        private: true,
        process: (client, message) => {
            return client.createMessage(message.channel_id);
        }
    }
};

function argsToString(args) {
    if (!args)
        return "";

    let arg_str = "";
    args.forEach(arg => {
        if (arg.type === "subcommand") {
            arg_str += `<${arg.oneof.reduce((pv, cv) => pv + cv.name + "|", "").slice(0,-1)}> `;
            arg.oneof.forEach(a => {
                if (a.args) {
                    arg_str += argsToString(a.args);
                }
            });
        }
        else {
            arg_str += `<${arg.name}>${arg.optional ? '?' : ""}`;
        }
    });

    return arg_str;
}

class Command {
    constructor(name, data) {
        this.name = name;
        this.args = data.args || [];
        this.doc = data.doc || "";
        this.private = data.private || false;
        this.process = data.process;
    }

    get usage() {
        return `**!${this.name}** ${argsToString(this.args)}\n  _${this.doc}_`;
    }
}

let exprt = {};

for (var c in command_data) {
  if (command_data.hasOwnProperty(c)) {
    let command = new Command(c, command_data[c]);

    exprt[c] = command;
  }
}

module.exports = exprt;
