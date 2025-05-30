const SteamUser = require('steam-user');
const fs = require('fs');
const winston = require('winston');
const path = require('path');
const readline = require('readline');

// Setup readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Setup logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'booster.log' })
  ]
});

// Load configuration
let config;
try {
  config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
  logger.info('Configuration loaded successfully');
} catch (error) {
  logger.error(`Failed to load configuration: ${error.message}`);
  process.exit(1);
}

// Update log level from config
if (config.settings && config.settings.logLevel) {
  logger.level = config.settings.logLevel;
  logger.info(`Log level set to ${config.settings.logLevel}`);
}

// Steam client instances
const clients = [];
const pendingAuthClients = [];
let activeAccounts = [];
let useCustomStatus = true; // Default to use custom status

// Ask user if they want to use custom playing status
function askForCustomStatusOption() {
  console.log("\n=== Steam Hour Booster ===");
  console.log("Apakah Anda ingin menggunakan custom playing status?");
  console.log("1. Ya, gunakan custom playing status (\"Jung Eunbi & Rei Supremacy!\" dll)");
  console.log("2. Tidak, tampilkan nama game asli");
  
  rl.question("Masukkan pilihan Anda (1/2): ", (answer) => {
    if (answer.trim() === "1") {
      useCustomStatus = true;
      logger.info("Menggunakan custom playing status");
    } else if (answer.trim() === "2") {
      useCustomStatus = false;
      logger.info("Menggunakan nama game asli");
    } else {
      logger.info("Pilihan tidak valid, menggunakan default: custom playing status");
    }
    
    // Continue to account selection
    askForAccountSelection();
  });
}

// Ask user which accounts to boost
function askForAccountSelection() {
  console.log("\n=== Pilih Akun ===");
  console.log("Pilih akun yang ingin di-boost:");
  
  config.accounts.forEach((account, index) => {
    console.log(`${index + 1}. ${account.username}`);
  });
  
  console.log(`${config.accounts.length + 1}. Semua akun`);
  console.log("0. Keluar");
  
  rl.question("Masukkan pilihan Anda (pisahkan dengan koma untuk multiple, contoh: 1,2): ", (answer) => {
    if (answer.trim() === "0") {
      console.log("Keluar dari aplikasi...");
      process.exit(0);
    }
    
    if (answer.trim() === `${config.accounts.length + 1}`) {
      // Boost all accounts
      activeAccounts = config.accounts.map((_, index) => index);
      logger.info(`Boosting semua akun: ${activeAccounts.length} akun`);
    } else {
      // Parse selected accounts
      const selections = answer.split(',').map(num => parseInt(num.trim()) - 1);
      activeAccounts = selections.filter(index => index >= 0 && index < config.accounts.length);
      
      if (activeAccounts.length === 0) {
        logger.error("Tidak ada akun valid yang dipilih. Keluar...");
        process.exit(1);
      }
      
      logger.info(`Boosting ${activeAccounts.length} akun: ${activeAccounts.map(i => config.accounts[i].username).join(', ')}`);
    }
    
    // Start the boosting process with selected accounts
    processAccounts();
  });
}

// Process selected accounts
function processAccounts() {
  if (activeAccounts.length === 0) {
    logger.info("Semua akun telah diproses.");
    return;
  }
  
  const accountIndex = activeAccounts.shift();
  const account = config.accounts[accountIndex];
  
  logger.info(`Setting up account: ${account.username}`);
  
  // Create Steam client
  const client = new SteamUser();
  clients.push(client);
  
  // Login to Steam
  client.logOn({
    accountName: account.username,
    password: account.password,
    rememberPassword: true
  });
  
  // Handle Steam Guard
  client.on('steamGuard', (domain, callback) => {
    const promptMessage = domain 
      ? `Masukkan kode Steam Guard yang dikirim ke email ${domain} untuk akun ${account.username}: `
      : `Masukkan kode Steam Guard dari mobile authenticator untuk akun ${account.username}: `;
    
    rl.question(promptMessage, (code) => {
      callback(code);
    });
  });
  
  // Handle events
  client.on('loggedOn', () => {
    logger.info(`Successfully logged in as ${account.username}`);
    
    // Set persona state (online, away, busy, etc.)
    const personaState = account.status === 'away' ? SteamUser.EPersonaState.Away : 
                         account.status === 'busy' ? SteamUser.EPersonaState.Busy : 
                         SteamUser.EPersonaState.Online;
    
    client.setPersona(personaState);
    
    // Start playing games with custom status (if enabled)
    if (account.games && Array.isArray(account.games) && account.games.length > 0) {
      // Always boost the games in the background
      client.gamesPlayed(account.games);
      logger.info(`Boosting ${account.games.length} games for ${account.username}: ${account.games.join(', ')}`);
      
      // Set custom playing status if enabled
      if (useCustomStatus && account.customPlayingStatus) {
        logger.info(`Setting custom playing status for ${account.username}: ${account.customPlayingStatus}`);
        // Set custom rich presence to display the custom status while still boosting games
        client.setPersona(personaState, account.customPlayingStatus);
      } else if (useCustomStatus && config.settings && config.settings.customPlayingStatus) {
        logger.info(`Setting global custom playing status for ${account.username}: ${config.settings.customPlayingStatus}`);
        // Set custom rich presence to display the custom status while still boosting games
        client.setPersona(personaState, config.settings.customPlayingStatus);
      }
    } else {
      logger.warn(`No games specified for ${account.username}`);
      
      // Set custom playing message even if no games are specified
      if (useCustomStatus && account.customPlayingStatus) {
        client.gamesPlayed(account.customPlayingStatus);
      } else if (useCustomStatus && config.settings && config.settings.customPlayingStatus) {
        client.gamesPlayed(config.settings.customPlayingStatus);
      } else if (config.settings && config.settings.playingMessage) {
        client.gamesPlayed(config.settings.playingMessage);
      }
    }
    
    // Process next account if any
    if (activeAccounts.length > 0) {
      processAccounts();
    }
  });
  
  // Handle chat messages
  client.on('friendMessage', (steamID, message) => {
    const senderSteamID = steamID.getSteamID64();
    logger.info(`Received message from ${senderSteamID} to ${account.username}: ${message}`);
    
    // Get auto-reply message from config or use default
    const autoReplyMessage = account.autoReply || 
                            (config.settings && config.settings.defaultAutoReply) || 
                            "I'm currently AFK. This is an automated response.";
    
    // Send auto-reply
    client.chat.sendFriendMessage(steamID, autoReplyMessage);
    logger.info(`Auto-replied to ${senderSteamID} from ${account.username} with: ${autoReplyMessage}`);
  });
  
  client.on('error', (err) => {
    logger.error(`Error on account ${account.username}: ${err.message}`);
    
    // If there was an error with this account, move to the next one
    if (activeAccounts.length > 0) {
      processAccounts();
    }
    
    // Attempt to reconnect after a delay
    setTimeout(() => {
      logger.info(`Attempting to reconnect ${account.username}...`);
      client.logOn({
        accountName: account.username,
        password: account.password,
        rememberPassword: true
      });
    }, 60000); // Wait 1 minute before reconnecting
  });
}

// Start the application by asking for custom status preference
askForCustomStatusOption();

// Handle process termination
process.on('SIGINT', () => {
  logger.info('Shutting down Steam Hour Booster...');
  clients.forEach(client => client.logOff());
  rl.close();
  process.exit(0);
}); 