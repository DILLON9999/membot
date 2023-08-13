const { installCommands, registerInteractions, client } = require('./install');
const connectToDatabase = require('./database/database');

connectToDatabase();
client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    installCommands();
    registerInteractions();
});

client.login('MTEzOTY4MzMxNzMwNjg4ODE5Mw.Grljf1.J0LvZdZiEInMsbiS62QlxUKwH7_yHif6rwC2xs');
// MTEzODI3MTYyNDY2ODM4NTM4MQ.G_0BsQ.Y5ip6NjbklXz5AcJWR0ggMaKkZ6FnePS0_XyBw