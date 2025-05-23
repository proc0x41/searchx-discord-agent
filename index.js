const fs = require('fs');
const { Client } = require('discord.js-selfbot-v13');
const axios = require('axios');

const TOKENS_FILE = 'tokens.json';
const ENDPOINT = 'http://192.168.18.103/discord';
const MAX_SIZE_BYTES = 1024;

let clients = [];
let messageBuffer = [];
let currentSize = 0;

function loadTokens() {
  try {
    const content = fs.readFileSync(TOKENS_FILE, 'utf8');
    const tokens = JSON.parse(content);
    if (!Array.isArray(tokens)) throw new Error('Formato inválido de tokens.json');
    return tokens;
  } catch (err) {
    console.error('[!] Erro ao carregar tokens:', err.message);
    process.exit(1);
  }
}

function estimateSize(obj) {
  return Buffer.byteLength(JSON.stringify(obj), 'utf8');
}

async function flushBuffer() {
  if (messageBuffer.length === 0) return;

  const payload = JSON.stringify(messageBuffer);
  try {
    const res = await axios.post(ENDPOINT, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log(`[+] Enviadas ${messageBuffer.length} mensagens - status ${res.status}`);
  } catch (e) {
    console.error('[!] Falha ao enviar mensagens:', e.message);
  }

  messageBuffer = [];
  currentSize = 0;
}

function extractMessageData(message) {
  return {
    messageId: message.id,
    content: message.content,
    timestamp: message.createdTimestamp,
    edited: !!message.editedTimestamp,
    author: {
      id: message.author.id,
      username: message.author.username,
      globalName: message.author.globalName,
      discriminator: message.author.discriminator,
      avatar: message.author.avatar
    },
    channel: {
      id: message.channel.id,
      name: message.channel.name || null,
      type: message.channel.type
    },
    guild: message.guild ? {
      id: message.guild.id,
      name: message.guild.name
    } : null,
    attachments: Array.from(message.attachments.values()).map(att => ({
      name: att.name,
      url: att.url,
      contentType: att.contentType
    })),
    replyToMessageId: message.reference?.messageId || null
  };
}

function setupClient(token, idx) {
  const client = new Client();

  client.on('ready', () => {
    console.log(`[${idx}] Logado como ${client.user.tag}`);
  });

  client.on('messageCreate', async (message) => {
    if (!message.author || message.author.bot) return;

    try {
      const user = await message.author.fetch();
      message.author.globalName = user.globalName;
    } catch {
      message.author.globalName = null;
    }

    const msgData = extractMessageData(message);
    const size = estimateSize(msgData);

    if (currentSize + size >= MAX_SIZE_BYTES) {
      await flushBuffer();
    }

    messageBuffer.push(msgData);
    currentSize += size;
  });

  client.login(token);
  clients.push(client);
}

const tokens = loadTokens();
tokens.forEach(setupClient);

setInterval(flushBuffer, 60 * 1000);
