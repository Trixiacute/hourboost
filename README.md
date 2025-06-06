# Steam Hour Booster

A simple Node.js application to boost your Steam account's hours in selected games. This application is designed to be deployed on Pterodactyl panel.

## Features

- Boost multiple games simultaneously
- Support for multiple Steam accounts
- Interactive account selection via terminal
- Toggle custom playing status on/off via terminal
- Steam Guard authentication support
- Custom "Now Playing" status messages
- Configurable through a simple JSON file
- Automatic replies to Steam chat messages
- Lightweight and easy to deploy
- Works with Pterodactyl panel

## Setup

1. Configure your Steam account credentials in the `config.json` file
2. Add as many accounts as you need (each in its own object in the accounts array)
3. Select the games you want to boost by adding their AppIDs
4. Set up your custom playing status and auto-reply message
5. Deploy to your Pterodactyl panel

## Running the Application

When you start the application, you'll see interactive menus:

1. First, you'll be asked if you want to use custom playing status:
   - Select "Ya" to use the custom status messages defined in your config
   - Select "Tidak" to show the actual game names instead

2. Then you'll be prompted to select which accounts to boost:
   - Enter a single number to boost one account
   - Enter multiple numbers separated by commas (e.g., "1,2") to boost specific accounts
   - Select "All accounts" to boost all configured accounts
   - Select "Exit" to quit

3. If Steam Guard is enabled for any account:
   - You'll be prompted to enter the Steam Guard code for each account
   - Follow the instructions on screen to enter the code from your email or mobile authenticator

## Configuration

Edit the `config.json` file with your Steam account details:

```json
{
  "accounts": [
    {
      "username": "your_first_account",
      "password": "password_for_first",
      "games": [730, 440, 570],  // Example game IDs (CS:GO, TF2, Dota 2)
      "status": "online",
      "autoReply": "I'm currently AFK. This is an automated response.",
      "autoReplyDelay": 5,
      "customPlayingStatus": "✨ Playing My Favorite Game ✨"
    },
    {
      "username": "your_second_account",
      "password": "password_for_second",
      "games": [730, 440, 570],
      "status": "online",
      "autoReply": "AFK at the moment. Will respond later.",
      "autoReplyDelay": 2,
      "customPlayingStatus": "🎮 Gaming Time 🎮"
    }
  ],
  "settings": {
    "logLevel": "info",
    "playingMessage": "Steam Hour Booster",
    "defaultAutoReply": "I'm currently away. I'll respond to your message later.",
    "autoReplyDelay": 3,
    "customPlayingStatus": "🎮 Gaming Time 🎮"
  }
}
```

## Multiple Accounts

You can boost hours on multiple Steam accounts simultaneously:

- Add each account as a separate object in the `accounts` array
- Each account can have its own games, status, auto-reply message, and custom playing status
- The application will handle each account independently
- You can choose which accounts to boost when starting the application

## Custom Playing Status

You can set a custom "Now Playing" status instead of showing the actual game names:

- Set `customPlayingStatus` for each account to have a personalized playing status
- Or set a global `customPlayingStatus` in the settings section that will apply to all accounts without a custom status
- The application will still boost the specified games in the background even when using custom status
- You can toggle this feature on/off at startup via the interactive menu

## How Game Boosting Works

- When using custom playing status, the games will still be boosted in the background
- Your Steam profile will show your custom status (e.g., "Jung Eunbi & Rei Supremacy!") instead of game names
- Your hours in the specified games will continue to increase
- When not using custom status, your profile will show the actual game names

## Anti-VAC Feature

The application includes safety measures to prevent potential VAC (Valve Anti-Cheat) issues:

- **Game Limiting**: Automatically limits the number of games boosted simultaneously to a safe number
- **Safe Games**: Defines games known to be safe for simultaneous boosting
- **VAC Protection**: Prevents running multiple VAC-enabled games at the same time, which could trigger anti-cheat systems

Configure these settings in the `config.json` file:

```json
"antiVAC": {
  "enabled": true,
  "maxGamesPerAccount": 15,
  "safeGames": [730, 570, 440],
  "riskySources": ["unknown", "non-steam"],
  "preventMultipleVACGames": true
}
```

## Steam Guard Authentication

The application supports Steam Guard authentication:

- When logging in to an account with Steam Guard enabled, you'll be prompted to enter the code
- For email Steam Guard, you'll need to check your email for the code
- For mobile authenticator, you'll need to enter the code from your Steam mobile app
- Each account is processed sequentially to avoid confusion with multiple Steam Guard prompts

## Auto-Reply Feature

The application automatically responds to any Steam chat messages you receive while the booster is running. You can customize the auto-reply message for each account or set a default message for all accounts.

### Auto-Reply Delay

You can set a delay before sending auto-reply messages to make them appear more natural:
- Set `autoReplyDelay` for each account (in seconds) to customize the delay per account
- Or set a global `autoReplyDelay` in the settings section that will apply to all accounts without a specific delay
- Default delay is 3 seconds if not specified

## Deployment on Pterodactyl

1. Create a new server on your Pterodactyl panel using the Node.js egg
2. Upload these files to your server
3. Start the server

## Requirements

- Node.js 16+
- Internet connection
- Steam account 