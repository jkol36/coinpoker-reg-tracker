require('dotenv').config();
const { Client, IntentsBitField } = require('discord.js');
const getBalancesRateLimited = require('./getBalances');

// `client` is the bot instance. Make the bot admin while setting up bot.
const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds, // Enables listening to when the bot gets added to a new server (guild), etc.
        IntentsBitField.Flags.GuildMembers, // Enables listening to guild member-related events (e.g., when someone joins/leaves a server).
        IntentsBitField.Flags.GuildMessages, // Enables listening to message-related events in a server.
        IntentsBitField.Flags.MessageContent // Enables access to message content and allows the bot to read messages.
    ]
})

const COOLDOWN_TIME = 10000; // Set a 10 seconds cooldown time.
const usersOnCooldown = new Set(); // Set to store user IDs on cooldown.

// `ready` keyword event listener gets triggered once the bot is online and ready.
// `c.user.tag` contains the username and discriminator (the four digits after the username) of the bot.
client.on("ready", (c) => {
    console.log(`The bot is ready at ${c.user.tag}`)
})

// `messageCreate` keyword event listener that listens for messages in a channel the bot has access to.
client.on("messageCreate", async (message) => {

    // bot doesn't listen to other bots
    if (message.author.bot) return;

    // bot listens for '!coin' from users.
    if (message.content === '!coin') {
        // Check if user is on cooldown, and notify if so.
        if (usersOnCooldown.has(message.author.id)) {
            message.reply("Calm your tits.");
            return;
        }

        try {
            // Waits for function to finish which returns the balances.
            const balances = await getBalancesRateLimited();

            // If fetched balances, reply with them.
            if (balances) {
                const replyMessage = `Hot Balances: USDC: ${balances.hotUSDC}, USDT: ${balances.hotUSDT}, CHP: ${balances.hotCHP}, ETH: ${balances.hotETH}\nCold Balances: USDC: ${balances.coldUSDC}, USDT: ${balances.coldUSDT}, CHP: ${balances.coldCHP}, ETH: ${balances.coldETH} `;
                message.reply(replyMessage);

                // Put user on cooldown, then remove user from cooldown after the timeout.
                usersOnCooldown.add(message.author.id);
                setTimeout(() => usersOnCooldown.delete(message.author.id), COOLDOWN_TIME);
            } else {
                message.reply('Sorry, I could not retrieve the balances.');
            }
        } catch (error) {
            console.error(`Error: ${error.message}`);
            message.reply('Sorry, an error occurred while fetching the balances.');
        }
    }
});

client.login(process.env.DISCORD_BOT_TOKEN)
// run with: `node src/index.js`