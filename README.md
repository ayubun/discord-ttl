<p align="center">
  <img src="https://github.com/ayubun/discord-ttl/assets/49354780/671b667d-dbd0-472e-93b5-d771b7a7d637" />
</p>
<p align="center">
  <h1 align="center">Discord TTL</h1>
</p>

Discord TTL is a simple-to-selfhost Discord bot that protects privacy by deleting server messages older than a configurable TTL (time to live).
TTLs can be configured for an entire server and/or specific channels. Individuals can also configure their own TTLs to override the default server or channel settings.

Setting up Discord TTL via the setup script comes with auto-updates so that hosters can get all of the latest features automatically upon new GitHub releases. 
For those that wish to stay on a static version, auto-updates can be opted out of by adding a `--skip-auto-updater` flag to the setup script. An architecture 
diagram for the auto-updater can be found below.



<p align="center">
  <h3 align="center">Updater Architecture</h3>
</p>
<p align="center">
  <img src="https://github.com/ayubun/discord-ttl/assets/49354780/6de91184-ef05-4c69-b397-cda015e6601c" />
</p>

<p align="center">
  <h2 align="center">How do I get Discord TTL for my server?</h2>
</p>


There is currently no officially-maintained public Discord TTL bot. You can find a live (but private) version of this bot running at https://discord.gg/ayu. 
If you would like to self-host Discord TTL, follow the steps below:

<p align="center">
  <h3 align="center">If you are new to self-hosting</h3>
</p>

To get started, you'll need a server to host the bot on. If you already have one, that's great! Do note that the setup script in this tutorial only works 
on Debian/Ubuntu & MacOS, but it is possible to get Discord TTL running on any OS so long as you can install <a href="https://docs.docker.com/engine/install">Docker</a>.

If you do *not* have a server, a common & cheap option for self-hosting 24/7 is to purchase a VPS (virtual private server). You can find VPS providers all over the internet, 
each with their own pricings and server locations. <a href="https://galaxygate.net/hosting/vps">GalaxyGate's Standard 1GB</a> is a perfectly-capable USA-hosted option 
that might be within budget for most ($3/month), but any provider will work just as well.

The last option for self-hosting would be locally on a PC. This option is not advised since it would cause your Discord TTL instance to go offline every time your PC 
is shut down or sleeping, but it is the cheapest option if you are not concerned with 100% availability.

<p align="center">
  <h3 align="center">Once you have a place to host</h3>
</p>

Navigate to a suitable location to keep Discord TTL's files within. The home directory is a safe option:
```bash
cd ~
```
Then, clone this repository:
```bash
git clone https://github.com/ayubun/discord-ttl
```
After cloning, navigate to the newly-created `discord-ttl` directory:
```bash
cd discord-ttl
```
Lastly, run the `setup.sh` script. As mentioned earlier, this will install auto-updates.
```bash
./setup.sh
```
**If you wish to opt out of the auto updates, run this command to setup instead of the one above:**
```bash
./setup.sh --skip-auto-updater
```

<p align="center">
  <h3 align="center">After running the setup script</h3>
</p>

You will need a Discord bot token from the Discord Developers portal in order to run Discord TTL. If you don't know how to get one, check out [Discord.js's bot token guide](https://ayu.dev/r/discord-bot-token-guide).

Once you get a bot token, add it to the `.env` file created from the setup script on the line that says `DISCORD_BOT_TOKEN=` by using your preferred text editor. If you are operating entirely from the 
command line and you are not sure how to edit files, `nano` is a safe option. [How-To Geek's nano guide](https://www.howtogeek.com/42980/the-beginners-guide-to-nano-the-linux-command-line-text-editor) might 
serve as a helpful starting point.

Once the `.env` is saved with the bot token, you can start Discord TTL with `docker compose`:
```bash
docker compose up -d
```

To create an invite link for your newly-hosted Discord TTL instance, check out [Discord.js's bot invite links guide].
