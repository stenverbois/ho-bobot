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
        "doc": "How much time the bot has been online for",
        "process": (client, message) => {
            client.createMessage(message.channel_id, `I have been ruling this server for ${msToTime(client.uptime())}`);
        }
    },
    "commands": {
        "doc": "List all available commands",
        "process": (client, message) => {
            let commands_str = "";
            for (let command in module.exports) {
                let c = module.exports[command];
                commands_str += `**!${command}** ${c.args ? c.args : ""}\n  _${c.doc}_\n`;
            }
            client.createMessage(message.channel_id, commands_str);
        }
    },
    "hots": {
        "args": "<hero>",
        "doc": "View HotS build for <hero> on icy-veins.com and heroesfire.com",
        "process": (client, message, args) => {
            if (args[0].toLowerCase() === "murky") {
                client.createMessage(message.channel_id, "Fuck Murky", true);
                return;
            }
            client.createMessage(message.channel_id, `http://www.icy-veins.com/heroes/${args.join('-')}-build-guide \n`);
            client.createMessage(message.channel_id, `http://www.heroesfire.com/hots/wiki/heroes/${args.join('-')}`);
        }
    },
    "heroesfire": {
        "args": "<hero>",
        "doc": "View HotS build for <hero> on heroesfire.com",
        "process": (client, message, args) => {
            client.createMessage(message.channel_id, `http://www.heroesfire.com/hots/wiki/heroes/${args.join('-')}`);
        }
    },
    "icyveins": {
        "args": "<hero>",
        "doc": "View HotS build for <hero> on icy-veins.com",
        "process": (client, message, args) => {
            client.createMessage(message.channel_id, `http://www.icy-veins.com/heroes/${args.join('-')}-build-guide`);
        }
    }
};
