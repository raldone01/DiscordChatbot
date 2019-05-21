const Discord = require("discord.js");
const botconfig = require("./botconfig.json");
const ms = require("ms");
var ArgumentParser = require('argparse').ArgumentParser;

ArgumentParser.prototype.exit = function (status, message) {
  if (message) {
    if (status === 0) {
      this._printMessage(message);
    } else {
      this._printMessage(message, process.stderr);
    }
  }
}

//Fix stream
ArgumentParser.prototype._printMessage = function (message, stream) {
  //if (!stream) {
  //  stream = process.stdout;
  //}
  if (message) {
    this.XoutXvarX += ("" + message);
  }
};

function initParser() {
  var parser = new ArgumentParser({
    version: 'Pre-Alpha 0.1',
    addHelp:true,
    description: 'DiscordChatBot'
  });
  parser.XoutXvarX = "";
  var cmdParser = parser.addSubparsers({
    dest: "cmds"
  });
  var quitSubparser = cmdParser.addParser("stop", { addHelp: true, help: "Stops the chatbots."})
  var startSubparser = cmdParser.addParser("start", { addHelp: true, help: "Start the bots."})
  startSubparser.addArgument(
    [ '-d', '--delay', '--time' ],
    {
      help: 'Sets the delay between question and answer.',
      nargs: 1,
      defaultValue: "1s"
    }
  );
  startSubparser.addArgument(
    [ '-t', '--topic'],
    {
      help: 'Sets the topic the bots will chat about.',
      nargs: 1
    }
  );
  var configSubparser = cmdParser.addParser("config", { addHelp: true, help: "Configure the bots."})
  configSubparser.addArgument(
    [ '-a', '-u1', '--u1', '-user1', '--user1', '-username1', '--username1', '-name1', '--name1'],
    {
      help: 'Sets the username of Bot1.',
      nargs: 1
    }
  );
  configSubparser.addArgument(
    [ '-b', '-u2', '--u2', '-user2', '--user2', '-username2', '--username2', '-name2', '--name2'],
    {
      help: 'Sets the username of Bot2.',
      nargs: 1
    }
  );
  configSubparser.addArgument(
    [ '-g1' ],
    {
      help: 'Sets Bot1s gender.',
      nargs: 1,
      choices: ['F', 'M', 'U']
    }
  );
  configSubparser.addArgument(
    [ '-g2' ],
    {
      help: 'Sets Bot2s gender.',
      nargs: 1,
      choices: ['F', 'M', 'U']
    }
  );
  return parser;
}

//syntax
//tqtalk --delay [delay] --username1 [username1]:[M,F] --username2 [username2]:[M,F] --topic [TOPIC] --fault %                                   --realistic          --everyone //@everyone in every message
//       -d              -u1                           -u2                            -t             -f % (Gets worse every time spelling errors)   -r adapt type speed -e
// --help -h
//

/*process
    .on('unhandledRejection', (reason, p) => {
        console.error(reason, 'Unhandled Rejection at Promise', p);
    })
    .on('uncaughtException', err => {
        console.error(err, 'Uncaught Exception thrown');
        process.exit(1);
    });*/

// Das ist wie eine HashMap irgendwie      http://nodeca.github.io/argparse/#Namespace

const bot1 = new Discord.Client({disableEveryone: true});
bot1.login(botconfig.Bot1.SToken + "");

const bot2 = new Discord.Client({disableEveryone: true});
bot2.login(botconfig.Bot2.SToken + "");

console.log(`BOT1: ${botconfig.Bot1.SToken}`);
console.log(`BOT2: ${botconfig.Bot2.SToken}`);

const prefix = "tq";

const arr = [["Wie geht es dir?", "Mir geht es gut."],
             ["Was machst du gerade?", "Ich mache gerade nichts."]];

// npm install discord.js
// nodemon .\index.js
// https://discordapp.com/developers/applications/
function statusUpdate(bot, gender) {
  console.log(`${bot.user.username} is online!`);
  if(Math.random() <= 0.05 && gender === "MALE")
    bot.user.setActivity("dir beim Duschen zu", {type: "WATCHING"});
  else
    bot.user.setActivity("dir zu", {type: "WATCHING"});
}
bot1.on("ready", async () => {
  statusUpdate(bot1, botconfig.Bot1.gender)
});
bot2.on("ready", async () => {
  statusUpdate(bot2, botconfig.Bot2.gender)
});

// https://hastebin.com/puqaboqore    <---- Open this

var data = new Map();
//{channel, turn, firstquestion, stoppding, waiting}
// turn
// 0 -> bot1
// 1 -> bot2

function InstanceData(channel) {
  this.waiting = false;
  this.stopping = false;
  this.firstquestion = true;
  this.channel = channel;
}
InstanceData.prototype.answer = function(question) {
  //bot to answer next
  var curbot;
  //bot that questioned
  var otherbot;

  if(this.turn === 0) {
    curbot = bot1;
    otherbot = bot2;
  } else {
    curbot = bot2;
    otherbot = bot1;
  }

  if(!this.waiting && !this.stopping)
    this.waiting = true;
    this.msgTimeout = setTimeout(() => {
      if(this.channel) {
        var ans;

        if(!this.firstquestion) {
          for(var i = 0; i < arr.length; i++) {
            if(question === arr[i][0]) {
              ans = arr[i][1];
            }
          }
        } else {
          ans = `Schön dich kennenzulernen, ich heiße ${curbot.user.username}!`;
          this.firstquestion = false;
        }

        curbot.channels.find(x => x.id === this.channel).send(ans).catch(async() => { console.log(`Message: ${ans} Content: ${message.content}`) });
        if(!this.stopping)
          this.queTimeout = setTimeout(() => {
            this.randomQuestion(curbot);
          }, this.delay);

      }
      waiting = false;
    }, this.delay);
}
InstanceData.prototype.randomQuestion = function(bot) {

  //invert
  this.turn = (bot === bot1) ? 1 : 0;

  if(this.firstquestion) {
    bot.channels.find(x => x.id === this.channel).send(`Hallo, mein Name ist ${bot.user.username}!`);
    this.answer(null);
    return;
  }

  var qnum = Math.floor(Math.random() * arr.length);

  // Replace '1' with random selection of answer when multiple answers are supported
  bot.channels.find(x => x.id === this.channel).send(arr[qnum][0]);
  this.answer(arr[qnum][0]);

}

bot1.on("message", async message => {
  if(message.channel.type === "dm") return;
  if(!message.channel.members.find(x => x.id ===  bot1.user.id) && !message.channel.members.find('id', bot2.user.id)) return;

  var channel = message.channel.id;

  if(!message.author.bot) {
    let messageArray = message.content.split(" ");
    let cmd = messageArray;
    if(messageArray.length == 0)
    //error msg
      return;
    let user = getUserFromMention(messageArray[0]);
    if(user) {
      //check user id
      if(user.id != bot1.id && user.id != bot2.id)
        return;

      if(messageArray.length <= 2) {
        message.delete(1000).catch(() => {
          console.log(error);
        });
        //show help
        return;
      }
      cmd = messageArray.slice(1);
    }

    if(cmd[0].startsWith("tq")) {
      cmd[0] = cmd[0].replace("tq", "");

      message.delete(1000).catch(() => {
        console.log(error);
      });

      if(!message.member.hasPermission("ADMINISTRATOR")) return message.reply("You do not have permissions to use this command!").then(msg => {
        msg.delete(5000);
      }).catch(() => {
        console.log(error);
      });

      try {
        var parser = initParser();
        message.channel.send("PARSERRET:" + JSON.stringify(parser.parseArgs(cmd)) + "\nPARSEROUT" + parser.XoutXvarX);
      } catch(e) {
        message.channel.send(e + "")
      }

      /*if(!data.get(channel)) {

        //start

        var obj = new InstanceData(channel);

        if(args[0] && args[0].startsWith("delay:")) {
          var rawtime = args[0].slice("delay:".length);
          var ltime = ms(rawtime);
          if(ltime < 300) {
            return message.reply("The minimum delay is 300ms!").then(msg => {
              msg.delete(5000);
            }).catch(() => {
              console.log(error);
            });
          }
          obj.delay = ltime;
        } else {
          obj.delay = 1000;
        }

        data.set(channel, obj);

        if(Math.random() >= 0.5)
          obj.randomQuestion(bot1);
        else
          obj.randomQuestion(bot2);
      }
    } else if(cmd === "tqstop") {

      message.delete(1000).catch(() => {
        console.log(error);
      });

      if(!message.member.hasPermission("ADMINISTRATOR")) return message.reply("You do not have permissions to use this command!").then(msg => {
        msg.delete(5000);
      }).catch(() => {
        console.log(error);
      });

      var ldata = data.get(channel);
      if(!ldata) {
        return message.reply("The bots aren't chatting!").then(msg => {
          msg.delete(5000);
        }).catch(() => {
          console.log(error);
        });
      }
      ldata.stopping = true;
      if(ldata.queTimeout)
        clearTimeout(ldata.queTimeout);
      if(ldata.msgTimeout)
        clearTimeout(ldata.msgTimeout);

      setTimeout(() => {
        data.delete(ldata.channel);
      }, 2000);*/
    }
  }
});

function getUserFromMention(mention) {
	if (!mention) return;

  // https://discordjs.guide/miscellaneous/parsing-mention-arguments.html#implementation
  // Client ID: 29222090666XXXXXXX
  // Client Mention: <@ID>

	if (mention.startsWith('<@') && mention.endsWith('>')) {
		mention = mention.slice(2, -1);

		if (mention.startsWith('!')) {
			mention = mention.slice(1);
		}

		return client.users.get(mention);
	}
}

// was soll @Bot machen? help anzeigen?

/*

https://www.npmjs.com/package/argparse !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

client.on('message', message => {
	if (!message.content.startsWith(config.prefix)) return;

	const withoutPrefix = message.content.slice(config.prefix.length);
	const split = withoutPrefix.split(/ +/);
	const command = split[0];
	const args = split.slice(1);
});
*/

// Was jetzt?
//support *mention* in command
//syntax
//tqtalk --delay [delay] --username1 [username1]:[M,F] --username2 [username2]:[M,F] --topic [TOPIC] --fault %                                     --realistic          --everyone //@everyone in every message
//       -d              -u1                           -u2                            -t             -f % (Gets worse every time spelling errors)   -r adapt type speed -e
// --help -h
//
