const { Client } = require('discord.js-selfbot-v13');

function startSelfbot(token) {
const client = new Client();

client.on('ready', () => {
console.log(`[${client.user.tag}] conectado!`)
})

client.login(token).catch(err => {
  console.error(`Erro ao logar com o token: ${token.substring(0, 10)}...`, err.message);
});

client.on('messageCreate', (message) => {
  console.log(message)
})
}
tokens = [
  ""
]





tokens.forEach(startSelfbot);

