# Overview

Discord TTL is a simple Discord bot that protects privacy by deleting all server messages older than a given TTL (time-to-live). You can
find a live version of this bot running at https://discord.gg/ayu

Currently, Discord TTL is meant to be self-hosted; Self-hosting comes with a few benefits-- for one, you can guarantee that the bot won't do
anything you wont expect. It also allows you to have ratelimits If you would like to set it up for your server, follow the steps below!


# Steps to self-host

## If you are new to self-hosting
Firsly, I am happy that you are looking to expand your knowledge into this domain! To get started, you'll want a server to host your bot on.
If you already have one, that's great! For my own sanity, this tutorial will only cover the steps to setting up an Ubuntu
server, but it is possible to get Discord TTL running on any OS, so long as you can install 
[Docker](https://docs.docker.com/engine/install/ubuntu/) & [Docker Compose](https://docs.docker.com/compose/install/).

If you don't have a VPS yet, you can find them all over the internet :D If you need a recommendation, GalaxyGate's Standard 1GB offers a 
perfectly-capable $3/month option that might be within budget for most: https://galaxygate.net/hosting/vps/

## Once you have a suitable location to host the bot
Clone the repository to a desired location (such as your home directory):
```bash
cd ~ && git clone https://github.com/ayubun/discord-ttl
```
Then, navigate to the newly-created `discord-ttl` directory:
```bash
cd discord-ttl
```
Lastly, run the `setup.sh` script. Follow any instructions provided by the script:
```bash
./setup.sh
```
And you're done! :)

**Note**: You will need a Discord bot token from the Discord Developers portal to be able to run Discord TTL. Discord.js has a really
helpful guide on how to get one here: https://ayu.dev/r/discord-bot-token-guide

Once you get a bot token, paste it into the `.env` file where it says `DISCORD_BOT_TOKEN=`