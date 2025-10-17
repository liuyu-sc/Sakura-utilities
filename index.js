const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes } = require('discord.js');

// get envo
const CONFIG = {
    DISCORD_TOKEN: process.env.DISCORD_TOKEN,
    CLIENT_ID: process.env.CLIENT_ID,
    GUILD_ID: process.env.GUILD_ID,
    TARGET_CHANNEL_ID: '1380935821418561606',
    NOTIFICATION_ROLE_ID: '1380939505435021414'
};

// check envo
if (!CONFIG.DISCORD_TOKEN || !CONFIG.CLIENT_ID || !CONFIG.GUILD_ID) {
    console.error('❌ Error: Check all env.js and retry (DISCORD_TOKEN, CLIENT_ID, GUILD_ID)');
    process.exit(1);
}

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

// shift handler
function createShiftEmbed(interaction, timestamp, promotional, serverId) {
    const promotionalText = promotional === 'yes' ? 'promotional' : 'non-promotional';
    
    return new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('Store Shift')
        .setDescription(`<@&${CONFIG.NOTIFICATION_ROLE_ID}> ${interaction.user.toString()} is hosting a ${promotionalText} shift in ${serverId}. Join to serve our customers!`)
        .addFields(
            { name: '⏰ Time', value: timestamp, inline: true },
            { name: '⏳ Duration', value: '45-60 minutes', inline: true }
        )
        .setTimestamp()
        .setFooter({ text: 'SHC utilities' });
}

// slash com
async function registerCommands() {
    const commands = [
        {
            name: 'shift-host',
            description: 'Host a store shift',
            options: [
                {
                    name: 'timestamp',
                    type: 3,
                    description: 'The time when the shift starts (e.g. 2024-12-31 14:30)',
                    required: true
                },
                {
                    name: 'promotional',
                    type: 3,
                    description: 'Is this a promotional shift?',
                    required: true,
                    choices: [
                        { name: 'Yes', value: 'yes' },
                        { name: 'No', value: 'no' }
                    ]
                },
                {
                    name: 'server-id',
                    type: 3,
                    description: 'The server ID where the shift is hosted',
                    required: true
                }
            ]
        }
    ];

    const rest = new REST({ version: '10' }).setToken(CONFIG.DISCORD_TOKEN);
    
    try {
        console.log('🔄 Registering slash commands...');
        await rest.put(
            Routes.applicationGuildCommands(CONFIG.CLIENT_ID, CONFIG.GUILD_ID),
            { body: commands }
        );
        console.log('✅ Slash commands registered successfully!');
    } catch (error) {
        console.error('❌ Error registering commands:', error);
    }
}

// event bot
client.on('ready', () => {
    console.log(`✅ Bot is online as ${client.user.tag}!`);
    console.log(`🎯 Target channel: ${CONFIG.TARGET_CHANNEL_ID}`);
    registerCommands();
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === 'shift-host') {
        const timestamp = interaction.options.getString('timestamp');
        const promotional = interaction.options.getString('promotional');
        const serverId = interaction.options.getString('server-id');
        
        console.log(`📝 Shift command used by ${interaction.user.tag}: ${timestamp}, ${promotional}, ${serverId}`);
        
        try {
            const shiftEmbed = createShiftEmbed(interaction, timestamp, promotional, serverId);
            const targetChannel = await client.channels.fetch(CONFIG.TARGET_CHANNEL_ID);
            
            await targetChannel.send({ embeds: [shiftEmbed] });
            await interaction.reply({ 
                content: `✅ Shift announcement sent to <#${CONFIG.TARGET_CHANNEL_ID}>!`,
                ephemeral: true 
            });
            
            console.log(`✅ Announcement sent to channel ${CONFIG.TARGET_CHANNEL_ID}`);
            
        } catch (error) {
            console.error('❌ Error sending announcement:', error);
            await interaction.reply({ 
                content: '❌ Failed to send announcement. Please check if the channel ID is correct.',
                ephemeral: true 
            });
        }
    }
});

// shutdown stuff
process.on('SIGINT', () => {
    console.log('🛑 Shutting down bot...');
    client.destroy();
    process.exit(0);
});

// strating
client.login(CONFIG.DISCORD_TOKEN)
    .then(() => console.log('🔗 Logging in to Discord...'))
    .catch(error => {
        console.error('❌ Login failed:', error);
        process.exit(1);
    });
