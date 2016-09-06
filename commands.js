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

module.exports = {
    "uptime": {
        doc: "How much time I have been online for",
        process: (client, message) => {
            client.createMessage(message.channel_id, `I have been ruling this server for ${msToTime(client.uptime())}`);
        }
    },
    "commands": {
        doc: "List all available commands",
        process: (client, message) => {
            let commands_str = "";
            for (let command in module.exports) {
                let c = module.exports[command];
                commands_str += `**!${command}** ${c.args ? c.args : ""}\n  _${c.doc}_\n`;
            }
            client.createMessage(message.channel_id, commands_str);
        }
    },
    "music": {
        args: "<Youtube link>",
        doc: "Play a song",
        process: (client, message, args) => {
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
        }
    },
    "hots": {
        args: "<hero>",
        doc: "View HotS build for <hero> on icy-veins.com and heroesfire.com",
        process: (client, message, args) => {
            if (args[0].toLowerCase() === "murky") {
                client.createMessage(message.channel_id, "Fuck Murky", true);
                return;
            }
            client.createMessage(message.channel_id, `http://www.icy-veins.com/heroes/${args.join('-')}-build-guide \n`);
            client.createMessage(message.channel_id, `http://www.heroesfire.com/hots/wiki/heroes/${args.join('-')}`);
        }
    },
    "heroesfire": {
        args: "<hero>",
        doc: "View HotS build for <hero> on heroesfire.com",
        process: (client, message, args) => {
            client.createMessage(message.channel_id, `http://www.heroesfire.com/hots/wiki/heroes/${args.join('-')}`);
        }
    },
    "icyveins": {
        args: "<hero>",
        doc: "View HotS build for <hero> on icy-veins.com",
        process: (client, message, args) => {
            client.createMessage(message.channel_id, `http://www.icy-veins.com/heroes/${args.join('-')}-build-guide`);
        }
    }
};
