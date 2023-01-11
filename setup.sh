#!/bin/bash

# ================
# TERMINAL COLORS~
# ================
MOVE_UP=`tput cuu 1`
CLEAR_LINE=`tput el 1`
BOLD=`tput bold`
UNDERLINE=`tput smul`
RED_TEXT=`tput setaf 1`
GREEN_TEXT=`tput setaf 2`
YELLOW_TEXT=`tput setaf 3`
BLUE_TEXT=`tput setaf 4`
MAGENTA_TEXT=`tput setaf 5`
CYAN_TEXT=`tput setaf 6`
WHITE_TEXT=`tput setaf 7`
RESET=`tput sgr0`

# ======================================================
#                     FLAGS LOGIC
# Source: https://www.banjocode.com/post/bash/flags-bash
# ======================================================
SKIP_DOCKER=false
SKIP_DOCKER_STRING=""
SKIP_DOCKER_COMPOSE=false
SKIP_DOCKER_COMPOSE_STRING=""
SKIP_AUTO_UPDATER=false
SKIP_AUTO_UPDATER_STRING=""
BASH_SUFFIX_STRING=""
while [ "$1" != "" ]; do
    case $1 in
    --skip-docker)
        SKIP_DOCKER=true
        SKIP_DOCKER_STRING="--skip-docker "
        BASH_SUFFIX_STRING=" -s -- "
        ;;
    --skip-docker-compose)
        SKIP_DOCKER_COMPOSE=true
        SKIP_DOCKER_COMPOSE_STRING="--skip-docker-compose "
        BASH_SUFFIX_STRING=" -s -- "
        ;;
    --skip-auto-updater)
        SKIP_AUTO_UPDATER=true
        SKIP_AUTO_UPDATER_STRING="--skip-auto-updater "
        BASH_SUFFIX_STRING=" -s -- "
        ;;
    esac
    shift # remove the current value for `$1` and use the next
done

# =======================================
# OS CHECK & HOMEBREW INSTALL (for MacOS)
# =======================================
ENV="Linux"
if [[ "$OSTYPE" != "linux-gnu"* && "$OSTYPE" != "darwin"* ]]; then
  echo "${RESET}${RED_TEXT}[${BOLD}ERROR${RESET}${RED_TEXT}]${RESET}${BOLD}${YELLOW_TEXT} It looks like you are trying to run this script on a non-unix environment.${RESET}"
  echo "        ${YELLOW_TEXT}Please note that this script is ${UNDERLINE}only${RESET}${YELLOW_TEXT} designed for use on Ubuntu/MacOS.${RESET}" 
  exit 1
elif [[ "$OSTYPE" == "darwin"* ]]; then
  ENV="MacOS"
  # Make sure that Homebrew is installed / updated (used for docker/docker compose installations on mac)
  if [[ $(command -v brew) == "" ]]; then
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  else
    brew update
  fi
fi
echo "${RESET}${YELLOW_TEXT}[${BOLD}OS Check${RESET}${YELLOW_TEXT}]${RESET}${BOLD}${BLUE_TEXT} It looks like you're running this script on ${ENV}! Nice :)"

NEW_ENV=false
if ! [[ -f ".env" ]]; then
  echo "${RESET}${YELLOW_TEXT}(${ENV}) [${BOLD}Env Setup${RESET}${YELLOW_TEXT}]${RESET}${BOLD}${BLUE_TEXT} Creating .env file from .env.example...${RESET}" 
  cp .env.example .env
  NEW_ENV=true
  echo "${RESET}${YELLOW_TEXT}(${ENV}) [${BOLD}Env Setup${RESET}${YELLOW_TEXT}]${RESET}${BOLD}${GREEN_TEXT} .env file created!${RESET}" 
fi

# ======================================================
#                    DOCKER INSTALL
# Source: https://docs.docker.com/engine/install/ubuntu/
# ======================================================
if [[ $SKIP_DOCKER == true ]]; then
  echo "${RESET}${YELLOW_TEXT}(${ENV}) [${BOLD}Docker Setup${RESET}${YELLOW_TEXT}]${RESET}${BOLD}${BLUE_TEXT} Skipping Docker installation!${RESET}" 
else
  if [[ $ENV == "Linux" ]]; then
    # Remove any old files
    echo "${RESET}${YELLOW_TEXT}(${ENV}) [${BOLD}Docker Setup${RESET}${YELLOW_TEXT}]${RESET}${BOLD}${BLUE_TEXT} Preparing for Docker install...${RESET}" 
    sudo apt-get remove docker docker-engine docker.io containerd runc -y
    # Stable repository setup
    sudo apt-get update -y
    sudo apt autoremove -y
    sudo apt-get install \
        ca-certificates \
        curl \
        gnupg \
        lsb-release -y
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --yes --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
  fi
  echo "${RESET}${YELLOW_TEXT}(${ENV}) [${BOLD}Docker Setup${RESET}${YELLOW_TEXT}]${RESET}${BOLD}${BLUE_TEXT} Installing Docker...${RESET}" 
  if [[ $ENV == "MacOS" ]]; then
    brew install --cask docker
  else
    # Install Docker Engine
    sudo apt-get update -y
    sudo apt-get install docker-ce docker-ce-cli containerd.io -y
  fi
  echo "${RESET}${YELLOW_TEXT}(${ENV}) [${BOLD}Docker Setup${RESET}${YELLOW_TEXT}]${RESET}${BOLD}${GREEN_TEXT} Done!${RESET}" 
fi

# ================================================
#             DOCKER COMPOSE INSTALL
# Source: https://docs.docker.com/compose/install/
# ================================================
if [[ $SKIP_DOCKER_COMPOSE == true ]]; then
  echo "${RESET}${YELLOW_TEXT}(${ENV}) [${BOLD}Docker Compose Setup${RESET}${YELLOW_TEXT}]${RESET}${BOLD}${BLUE_TEXT} Skipping Docker Compose installation!${RESET}" 
else
  if [[ $ENV == "Linux" ]]; then
    # Remove any old files
    echo "${RESET}${YELLOW_TEXT}(${ENV}) [${BOLD}Docker Compose Setup${RESET}${YELLOW_TEXT}]${RESET}${BOLD}${BLUE_TEXT} Preparing for Docker Compose install...${RESET}" 
    sudo rm /usr/local/bin/docker-compose
    sudo rm /usr/bin/docker-compose
  fi
  echo "${RESET}${YELLOW_TEXT}(${ENV}) [${BOLD}Docker Compose Setup${RESET}${YELLOW_TEXT}]${RESET}${BOLD}${BLUE_TEXT} Installing Docker Compose...${RESET}" 
  if [[ $ENV == "MacOS" ]]; then
    brew install docker-compose
  else
    sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose
  fi
  echo "${RESET}${YELLOW_TEXT}(${ENV}) [${BOLD}Docker Compose Setup${RESET}${YELLOW_TEXT}]${RESET}${BOLD}${GREEN_TEXT} Done!${RESET}" 
fi

# ====================
#     AUTO-UPDATER
# ====================
# This just adds an entry to the crontab to run update-ttl.sh at a regular interval
if [[ $SKIP_AUTO_UPDATER == true ]]; then
  echo "${RESET}${YELLOW_TEXT}(${ENV}) [${BOLD}Auto-Updater Setup${RESET}${YELLOW_TEXT}]${RESET}${BOLD}${BLUE_TEXT} Skipping Auto-Updater setup!${RESET}" 
else
  # source: https://stackoverflow.com/questions/59895/how-do-i-get-the-directory-where-a-bash-script-is-located-from-within-the-script
  SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
  # Remove any existing entry in the crontab
  crontab -l | grep -v '/update-ttl.sh'  | crontab - &>/dev/null
  # Add update.sh to crontab
  (crontab -l 2>/dev/null; echo "55 23 * * * ${SCRIPT_DIR}/update-ttl.sh") | crontab -
  echo "${RESET}${YELLOW_TEXT}(${ENV}) [${BOLD}Auto-Updater Setup${RESET}${YELLOW_TEXT}]${RESET}${BOLD}${GREEN_TEXT} Added update-ttl.sh to crontab${RESET}" 
fi

# ================
#   FINAL PRINT
# ================
echo ""
echo "${RESET}${BOLD}${GREEN_TEXT}              Automated setup complete!${RESET}"
echo "${RESET}${BOLD}${GREEN_TEXT}                    ૮ ˶ᵔ ᵕ ᵔ˶ ა${RESET}"
echo ""
if [[ $NEW_ENV == true ]]; then
  echo "${RESET}${YELLOW_TEXT}      Be sure to place a Discord bot token in the${RESET}"
  echo "${RESET}${YELLOW_TEXT}      .env file where it says ${BOLD}DISCORD_BOT_TOKEN=${RESET}"
  echo "${RESET}${YELLOW_TEXT}       ${UNDERLINE}before${RESET}${YELLOW_TEXT} starting the bot. You can do this${RESET}"
  echo "${RESET}${YELLOW_TEXT}      via the terminal with your preferred text${RESET}"
  echo "${RESET}${YELLOW_TEXT}           editor (i.e. nano, vim, etc.).${RESET}"
  echo ""
  echo "${RESET}${YELLOW_TEXT}   If you do not currently have a Discord bot token${RESET}"
  echo "${RESET}${YELLOW_TEXT}  and you don't know how to get one, Discord.JS has a${RESET}"
  echo "${RESET}${YELLOW_TEXT}   really helpful tutorial for how to do such here:${RESET}"
  echo "${RESET}${BLUE_TEXT}      ${UNDERLINE}https://ayu.dev/r/discord-bot-token-guide${RESET}"
  echo ""
fi
echo "${RESET}${BOLD}${CYAN_TEXT}            To start Discord TTL, type${RESET}${CYAN_TEXT}:${RESET}"
echo ""
echo "${RESET}${WHITE_TEXT}               docker-compose up -d${RESET}"
echo ""
echo "${RESET}${BOLD}${CYAN_TEXT}             To check the logs, type${RESET}${CYAN_TEXT}:${RESET}"
echo ""
echo "${RESET}${WHITE_TEXT}               docker-compose logs${RESET}"
echo ""