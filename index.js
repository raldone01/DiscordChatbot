const Discord = require("discord.js");
const botconfig = require("./botconfig.json");
const ms = require("ms");
var ArgumentParser = require('argparse').ArgumentParser;

ArgumentParser.prototype.exit = function (status, message) {
  //console.log("EXIT CALLED?")
  //console.trace();
  throw message
}

ArgumentParser.prototype.error = function (err) {

  var firstTime = false

  if(!this.used) {
    this.used = "ignored";
    firstTime = true;
  }

  if(!err)
    throw err

  var message;
  if (err instanceof Error) {
    if(firstTime)
      this.printUsage();
    message = err.message;
  } else {
    message = err;
  }

  if(!message.endsWith('\n'))
    message += '\n'

  throw message;
};

ArgumentParser.prototype._printMessage = function (message, stream) {
  if (message) {
    if(this.XoutXparent) {
      this.XoutXparent.XoutXvarX += ("" + message)
    } else
      this.XoutXvarX  += ("" + message);
  }
};

function initParser(prefix) {
  var parser = new ArgumentParser({
    //version: 'Pre-Alpha 0.1',
    description: 'DiscordChatBot',
    prog: `${prefix}`
  });
  parser.XoutXvarX = "";
  var cmdParser = parser.addSubparsers({
    dest: "command"
  });
  var startSubparser = cmdParser.addParser("start", { help: "Start the bots."})
  startSubparser.XoutXparent = parser;
  startSubparser.addArgument(
    ['-f', '--faultz'],
    {
      help: 'Sets the fault percentages.'
    }
  )
  startSubparser.addArgument(
    [ '-d', '--delay', '--time' ],
    {
      help: 'Sets the delay between question and answer.',
      nargs: 1,
      defaultValue: ["1s"]
    }
  );
  startSubparser.addArgument(
    [ '-t', '--topic'],
    {
      help: 'Sets the topic the bots will chat about.',
      nargs: 1
    }
  );
  var quitSubparser = cmdParser.addParser("stop", { help: "Stops the chatbots."})
  quitSubparser.XoutXparent = parser;
  var configSubparser = cmdParser.addParser("config", {
    help: "Configure the bots serverwide."
  })
  configSubparser.XoutXparent = parser;
  configSubparser.addArgument(
    [ '-a', '--u1', '--user1', '--username1', '--nickname1', '--name1'],
    {
      help: 'Sets the username of Bot1.',
      nargs: 1
    }
  );
  configSubparser.addArgument(
    [ '-b', '--u2', '--user2', '--username2', '--nickname2', '--name2'],
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

process
    .on('unhandledRejection', (reason, p) => {
        console.error(reason, 'Unhandled Rejection at Promise', p);
    })
    .on('uncaughtException', err => {
        console.error(err, 'Uncaught Exception thrown');
        process.exit(1);
    });

var bots = []

async function statusUpdate() {
  var bot = this
  console.log(`${bot.Bot.user.username} is online!`);
  if(Math.random() <= 0.05 && bot.gender === "MALE")
    bot.Bot.user.setActivity("dir beim Duschen zu", {type: "WATCHING"});
  else
    bot.Bot.user.setActivity("dir zu", {type: "WATCHING"});
}

//build the defaultServerConf
var defaultServerConf = {
  prefix: botconfig.Config.prefix,
  removeMessages: botconfig.Config.removeMessages,
  bots: [],
  delay: botconfig.Config.minDelay
}
//read the bots from the botconfig
for(it in botconfig.Bots) {
  var curBot = bots[it] = botconfig.Bots[it]
  curBot.Bot = new Discord.Client({disableEveryone: true})
  curBot.Bot.login(curBot.sToken)
  curBot.Bot.on("ready", statusUpdate.bind(curBot))

  //add Bot to defaultServerConf
  defaultServerConf.bots[it] = {}
  if(curBot.gender)
    defaultServerConf.bots[it].gender = curBot.gender
  if(curBot.faultz)
    defaultServerConf.bots[it].faultz = curBot.faultz
  if(curBot.nickname)
    defaultServerConf.bots[it].nickname = curBot.nickname
}

const arr = [["Wie geht es dir?", "Mir geht es gut."],
             ["Was machst du gerade?", "Ich mache gerade nichts."]];

/**per server -> key is the server id
persistent (perhaps loki.js)
contains:
bots: -> default per bot settings
  nickname
  gender
  fautlz: percentages -> spelling errors
removeMessages: true|false
prefix
*/
var configData = new Map();

function getServerConf(serverId) {
  return data.get(serverId)
}

function putServerConf(serverId, serverConf) {
  data.set(serverId, serverConf)
}

/*
Takes json:
{
  bots : {
    fautlz, //percentages -> spelling errors
    gender,
    nickname
  },
  removeMessages,
  prefix
}
*/
function createServerConf(arg) {
  var ret = JSON.parse(JSON.stringify(defaultServerConf))
  for(var i = 0; i < arg.bots.length; i++) {
    if(arg.bots[i].faultz)
      ret.bots[i].faultz = arg.bots[i].faultz;
    if(arg.bots[i].gender)
      ret.bots[i].gender = arg.bots[i].gender;
    if(arg.bots[i].nickname)
      ret.bots[i].nickname = arg.bots[i].nickname;
  }
  if(arg.removeMessages)
    ret.removeMessages = arg.removeMessages
  if(arg.prefix)
    ret.prefix = arg.prefix
}

/**per channel -> key is the channel id
not persistent
contains:
  bots:
    fautlz: percentages -> spelling errors
    gender
    nickname
  removeMessages: true|false
  delay: time[ms]
  topic: topic
  everyone: true|false
  channelId
  serverId
*/
var data = new Map();

function getDataObject(channelId) {
  return data.get(channelId)
}

function putDataObject(dataObj) {
  data.set(dataObj.channelId, dataObj)
}

/**
Takes json:
{
  serverId,
  channelId,
  bots : {
    fautlz, //percentages -> spelling errors
    gender,
    nickname
  },
  delay,
  removeMessages,
  topic,
  everyone
}
*/
function createDataObject(arg) {
  var serverConf = getServerConf(arg.serverId)
  var ret = JSON.parse(JSON.stringify(serverConf))
  ret.channelId = arg.channelId;
  ret.serverId = arg.serverId;
  for(var i = 0; i < arg.bots.length; i++) {
    if(arg.bots[i].faultz)
      ret.bots[i].faultz = arg.bots[i].faultz;
    if(arg.bots[i].gender)
      ret.bots[i].gender = arg.bots[i].gender;
    if(arg.bots[i].nickname)
      ret.bots[i].nickname = arg.bots[i].nickname;
  }
  if(arg.delay)
    ret.delay = arg.delay;
  if(ret.delay < botconfig.Config.minDelay)
    throw new Error("Delay too small!")
  if(arg.removeMessages)
    ret.removeMessages = arg.removeMessages;
  ret.everyone = arg.everyone;
  ret.topic = arg.topic;

  Object.create(DataObject.prototype, ret)

  return ret
}

function DataObject() {}
DataObject.prototype.answer = function(question) {
  var bot1 = bots[0].Bot
  var bot2 = bots[1].Bot

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

  if(!this.stopping)
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
    }, this.delay);
}

DataObject.prototype.randomQuestion = function(bot) {

  var bot1 = bots[0].Bot
  var bot2 = bots[1].Bot

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

bots[0].Bot.on("message", async message => {
  if(message.channel.type === "dm") return;

  //TODO: Check how many bots are available in the channel if(!message.channel.members.find(x => x.id ===  bot1.user.id) && !message.channel.members.find('id', bot2.user.id)) return;

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
        if(botconfig.removeMessages)
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

      cmd = cmd.filter(Boolean);

      if(botconfig.removeMessages)
        message.delete(1000).catch(() => {
          console.log(error);
        });

      if(!message.member.hasPermission("ADMINISTRATOR")) return message.reply("You do not have permissions to use this command!").then(msg => {
        if(botconfig.removeMessages)
          msg.delete(5000);
      }).catch(() => {
        console.log(error);
      });

      var parser = initParser('tq');
      try {
        console.dir(cmd)
        var ret = JSON.stringify(parser.parseArgs(cmd));
        if(parser.XoutXvarX)
          message.channel.send(parser.XoutXvarX);
        console.log("PARSERRET:" + ret)
      } catch(e) {
        var msg = ""
        if(parser.XoutXvarX)
          msg = parser.XoutXvarX
        if(e)
          msg += e
        message.channel.send(msg)
        return;
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

/*

//{channel, turn, firstquestion, stoppding, waiting}
// turn
// 0 -> bot1
// 1 -> bot2





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
