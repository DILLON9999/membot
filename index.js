const { installCommands, registerInteractions, client } = require('./install');
const connectToDatabase = require('./database/database');
const buy = require("./commands/buy/buy")

connectToDatabase();
client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    installCommands();
    registerInteractions();
});

client.on('messageCreate', async message => {
    if(message.content.startsWith('0x') && (message.content.split(' ')).length == 1 && !message.author.bot ){
        message["user"] = {"id": message.author.id}
        await buy(message, message.content)
        // await purchase(message);
    }
});

// // PROD BOT
// client.login('MTEzOTY4MzMxNzMwNjg4ODE5Mw.Grljf1.J0LvZdZiEInMsbiS62QlxUKwH7_yHif6rwC2xs');

// TEST BOT
client.login('MTEzOTI0NjY1ODA0ODIzMzYxNA.Gqo-JJ.chUss1NOEs5XoM_Pqchs9G2Km0O6rcw_TKqB0Q');