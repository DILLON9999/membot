const { installCommands, registerInteractions, client } = require('./install');
const connectToDatabase = require('./database/database');

connectToDatabase();
client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    installCommands();
    registerInteractions();
});

client.login('MTEzOTI0NjY1ODA0ODIzMzYxNA.GdfQUb.nFAoEwrzY1lB0NHrHpJaLeyH2V8ARoS1eg-VG4');
// MTEzODI3MTYyNDY2ODM4NTM4MQ.G_0BsQ.Y5ip6NjbklXz5AcJWR0ggMaKkZ6FnePS0_XyBw