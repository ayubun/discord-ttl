#!/bin/bash

# ======================
#    TERMINAL COLORS~
# ======================
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

CURRENT_DIR=$(pwd)
# source: https://stackoverflow.com/questions/59895/how-do-i-get-the-directory-where-a-bash-script-is-located-from-within-the-script
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

# ======================================================
#                     FLAGS LOGIC
# Source: https://www.banjocode.com/post/bash/flags-bash
# ======================================================
SKIP_DOCKER=false
SKIP_DOCKER_COMPOSE=false
SKIP_AUTO_UPDATER=false
while [ "$1" != "" ]; do
    case $1 in
    --skip-docker)
        SKIP_DOCKER=true
        ;;
    --skip-auto-updater)
        SKIP_AUTO_UPDATER=true
        ;;
    esac
    shift # remove the current value for `$1` and use the next
done

# Ensure the .env exists
if [[ ! -f ".env" ]]; then
  NEW_DOTENV=true
  cp .env.example .env
fi

# =======================================
# OS CHECK & HOMEBREW INSTALL (for MacOS)
# =======================================
ENV="Linux"
if [[ "$OSTYPE" != "linux-gnu"* && "$OSTYPE" != "darwin"* ]]; then
  echo "${RESET}${RED_TEXT}[${BOLD}ERROR${RESET}${RED_TEXT}]${RESET}${BOLD}${YELLOW_TEXT} It looks like you are trying to run this script on a non-unix environment.${RESET}"
  echo "        ${YELLOW_TEXT}Please note that this script is ${UNDERLINE}only${RESET}${YELLOW_TEXT} designed for use on Ubuntu/MacOS.${RESET}" 
  return 1
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

# ======================================================
#                    DOCKER INSTALL
# Source: https://docs.docker.com/engine/install/ubuntu/
# ======================================================
if docker version &>/dev/null && docker compose version &>/dev/null; then
    echo "${RESET}${YELLOW_TEXT}(${ENV}) [${BOLD}Docker Setup${RESET}${YELLOW_TEXT}]${RESET}${BOLD}${BLUE_TEXT} Docker installation detected${RESET}" 
    SKIP_DOCKER=true
fi
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
    brew uninstall --cask docker --force &>/dev/null
    brew install --cask docker --force
  else
    # Install Docker Engine
    sudo apt-get update -y
    sudo apt-get install docker-ce docker-ce-cli containerd.io -y
  fi
  echo "${RESET}${YELLOW_TEXT}(${ENV}) [${BOLD}Docker Setup${RESET}${YELLOW_TEXT}]${RESET}${BOLD}${GREEN_TEXT} Done!${RESET}" 
fi

# ===================
#  AUTO-UPDATER CRON
# ===================
# This just adds an entry to the crontab to run update-ttl.sh at a regular interval
if [[ $SKIP_AUTO_UPDATER == true ]]; then
  echo "${RESET}${YELLOW_TEXT}(${ENV}) [${BOLD}Auto-Updater Setup${RESET}${YELLOW_TEXT}]${RESET}${BOLD}${BLUE_TEXT} Skipping Auto-Updater setup!${RESET}" 
else
  # source: https://stackoverflow.com/questions/59895/how-do-i-get-the-directory-where-a-bash-script-is-located-from-within-the-script
  SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
  # Remove any existing entry in the crontab
  crontab -l | grep -v '/bin/update-ttl.sh'  | crontab - &>/dev/null
  # Add update.sh to crontab
  (crontab -l 2>/dev/null; echo "10 */6 * * * ${SCRIPT_DIR}/bin/update-ttl.sh") | crontab -
  echo "${RESET}${YELLOW_TEXT}(${ENV}) [${BOLD}Auto-Updater Setup${RESET}${YELLOW_TEXT}]${RESET}${BOLD}${GREEN_TEXT} Added update-ttl.sh to crontab${RESET}" 
fi

# Return to the directory we initially ran the script from
cd $CURRENT_DIR

# ================
#   FINAL PRINT
# ================
echo ""
echo "${RESET}${BOLD}${GREEN_TEXT}              Automated setup complete!${RESET}"
echo "${RESET}${BOLD}${GREEN_TEXT}                    ૮ ˶ᵔ ᵕ ᵔ˶ ა${RESET}"
echo ""
if [[ $NEW_DOTENV == true ]]; then
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
echo "${RESET}${BOLD}${CYAN_TEXT} If TTL goes offline, you can start it by typing${RESET}${CYAN_TEXT}:${RESET}"
echo ""
echo "${RESET}${WHITE_TEXT}               docker compose up -d${RESET}"
echo ""
echo "${RESET}${BOLD}${CYAN_TEXT}             To check the logs, type${RESET}${CYAN_TEXT}:${RESET}"
echo ""
echo "${RESET}${WHITE_TEXT}               docker compose logs -f${RESET}"
echo ""
if [[ $ENV == "MacOS" && $SKIP_DOCKER == false ]]; then
  echo "${RESET}${YELLOW_TEXT} Since you are on Mac OS, you may need to start the${RESET}"
  echo "${RESET}${YELLOW_TEXT} Docker app first via Cmd + Space -> Typing \"Docker\"${RESET}"
  echo ""
fi
