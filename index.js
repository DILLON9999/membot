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
    }
});

// PROD BOT
client.login(process.env.DISCORD_BOT_TOKEN);
