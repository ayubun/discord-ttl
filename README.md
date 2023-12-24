# Overview

Discord TTL is a simple Discord bot that protects privacy by deleting all server messages older than a given TTL (time-to-live).

### Updater Architecture

Discord TTL comes with auto-updates so that hosters can get all of the latest features automatically upon new GitHub releases.
Below is an architecture diagram of how the updater works (with `v1.0.1` as an example):

![architecture](https://github.com/ayubun/discord-ttl/assets/49354780/6de91184-ef05-4c69-b397-cda015e6601c)

There is currently no officially-maintained public Discord TTL bot. You can
find a live (but private) version of this bot running at https://discord.gg/ayu.

If you would like to self-host Discord TTL, follow the steps below! Once setup, 
the Discord TTL bot will work across multiple servers. Slower deletions may occur if the bot is added to many servers (20+).

# Steps to self-host

## If you are new to self-hosting
Firstly, I am happy that you are looking to expand your knowledge into this domain! To get started, you'll want a server to host your bot on.
If you already have one, that's great! For my own sanity, the script in this tutorial only works on Debian/Ubuntu & MacOS, but it is
possible to get Discord TTL running on any OS so long as you can install [Docker](https://docs.docker.com/engine/install/ubuntu/).

If you don't have a VPS yet, you can find them all over the internet :D If you need a recommendation, GalaxyGate's Standard 1GB offers a 
perfectly-capable $3/month option that might be within budget for most: https://galaxygate.net/hosting/vps/

## Once you have a suitable location to host the bot
Clone the repository to a desired location (such as your home directory):
```bash
cd ~
git clone https://github.com/ayubun/discord-ttl
```
Then, navigate to the newly-created `discord-ttl` directory, and checkout the `v1` branch:
```bash
cd ~/discord-ttl
git checkout v1
```
Lastly, run the `setup.sh` script. Follow any instructions provided by the script:
```bash
./setup.sh
```
And you're done! :)

**Note**: You will need a Discord bot token from the Discord Developers portal to be able to run Discord TTL. Discord.js has a really
helpful guide on how to get one here: https://ayu.dev/r/discord-bot-token-guide

Once you get a bot token, paste it into the `.env` file where it says `DISCORD_BOT_TOKEN=`
