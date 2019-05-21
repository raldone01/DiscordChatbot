const Discord = require("discord.js");
const botconfig = require("./botconfig.json");
const ms = require("ms");

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

bot1.on("ready", async () => {
  console.log(`${bot1.user.username} is online!`);
  if(Math.random() <= 0.05 && botconfig.Bot1.gender === "MALE")
    bot1.user.setActivity("dir beim Duschen zu", {type: "WATCHING"});
  else
    bot1.user.setActivity("dir zu", {type: "WATCHING"});
});
bot2.on("ready", async () => {
  console.log(`${bot2.user.username} is online!`);
  if(Math.random() <= 0.05 && botconfig.Bot2.gender === "MALE")
    bot2.user.setActivity("dir beim Duschen zu", {type: "WATCHING"});
  else
    bot2.user.setActivity("dir zu", {type: "WATCHING"});
});

var data = new Map();
//{channel, turn, firstquestion, stopping, waiting}
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
    let cmd = messageArray[0];
    let args = messageArray.slice(1);

    if(cmd === "tqtalk") {

      message.delete(1000).catch(() => {
        console.log(error);
      });

      if(!message.member.hasPermission("ADMINISTRATOR")) return message.reply("You do not have permissions to use this command!").then(msg => {
        msg.delete(5000);
      }).catch(() => {
        console.log(error);
      });

      if(!data.get(channel)) {

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

      message.delete(1000).catch(() => {
        console.log(error);
      });

      setTimeout(() => {
        data.delete(ldata.channel);
      }, 2000);
    }
  }
});

//syntax
//tqtalk --delay [delay] --username1 [username1]:[M,F] --username2 [username2]:[M,F] --topic [TOPIC] --fault                                     --realistic          --everyone //@everyone in every message
//       -d              -u1                           -u2                            -t             -f (Gets worse every time spelling errors)   -r adapt type speed -e
// --help -h
//
