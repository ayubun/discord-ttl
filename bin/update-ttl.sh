#!/bin/bash

# ================
# TERMINAL COLORS~
# ================
BOLD=`tput bold`
UNDERLINE=`tput smul`
RED_TEXT=`tput setaf 1`
GREEN_TEXT=`tput setaf 2`
YELLOW_TEXT=`tput setaf 3`
BLUE_TEXT=`tput setaf 4`
RESET=`tput sgr0`

CURRENT_DIR=$(pwd)
# source: https://stackoverflow.com/questions/59895/how-do-i-get-the-directory-where-a-bash-script-is-located-from-within-the-script
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
cd $SCRIPT_DIR && cd ..

# ========================
# UPSTREAM VERSION CHECKER
# ========================

# Reads the version number in package.json
# src: https://gist.github.com/DarrenN/8c6a5b969481725a4413
# + https://stackoverflow.com/questions/428109/extract-substring-in-bash to remove space in front
CURRENT_VERSION=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g')
CURRENT_VERSION=${CURRENT_VERSION#* }

# Remove anything past the .'s in CURRENT_VERSION
# src: https://stackoverflow.com/questions/428109/extract-substring-in-bash to remove space in front
CURRENT_MAJOR_VERSION=${CURRENT_VERSION%\.*\.*}
RAW_CONTENT_URL=https://raw.githubusercontent.com/ayubun/discord-ttl/v${CURRENT_MAJOR_VERSION}

# Using the major version, grab the latest package.json version number on the ttl repo
UPSTREAM_VERSION=$(curl -s ${RAW_CONTENT_URL}/package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g')
UPSTREAM_VERSION=${UPSTREAM_VERSION#* }

# We will check this JUST in case the major versions are mismatched (this shouldn't happen but /shrug ppl make mistakes)
UPSTREAM_MAJOR_VERSION=${UPSTREAM_VERSION%\.*\.*}

if [[ $CURRENT_MAJOR_VERSION != $UPSTREAM_MAJOR_VERSION ]]; then
  echo "${RESET}${RED_TEXT}[${BOLD}ERROR${RESET}${RED_TEXT}]${RESET}${BOLD}${YELLOW_TEXT} The upstream major version is unexpected! The updater will only update the container(s) now.${RESET}" 
  echo "${RESET}${YELLOW_TEXT}[${BOLD}TTL Updater${RESET}${YELLOW_TEXT}]${RESET}${BOLD}${BLUE_TEXT} Pulling any new docker image(s)...${RESET}" 
  docker-compose pull
  echo "${RESET}${YELLOW_TEXT}[${BOLD}TTL Updater${RESET}${YELLOW_TEXT}]${RESET}${BOLD}${BLUE_TEXT} Upping container(s)...${RESET}"
  docker-compose up -d
  echo "${RESET}${YELLOW_TEXT}[${BOLD}TTL Updater${RESET}${YELLOW_TEXT}]${RESET}${BOLD}${GREEN_TEXT} Done! Discord TTL container(s) should now be up-to-date :)${RESET}"
  return 1
fi

if [[ $CURRENT_VERSION < $UPSTREAM_VERSION ]]; then
  # PULL UPDATED SCRIPTS
  echo "${RESET}${YELLOW_TEXT}[${BOLD}TTL Updater${RESET}${YELLOW_TEXT}]${RESET}${BOLD}${BLUE_TEXT} Pulling updated scripts...${RESET}" 
  SETUP_UPDATED=false
  if [[ $(curl -s ${RAW_CONTENT_URL}/setup.sh) != $(cat ./setup.sh) ]]; then
    SETUP_UPDATED=true
  fi
  # Currently unneeded \/
  # UPDATER_UPDATED=false
  # if [[ $(curl -s ${RAW_CONTENT_URL}/bin/update-ttl.sh) != $(cat ./bin/update-ttl.sh) ]]; then
  #   UPDATER_UPDATED=true
  # fi
  # BASH_CMD_UPDATED=false
  # if [[ $(curl -s ${RAW_CONTENT_URL}/bin/discord-ttl) != $(cat ./bin/discord-ttl) ]]; then
  #   BASH_CMD_UPDATED=true
  # fi
  curl -s ${RAW_CONTENT_URL}/setup.sh > ./setup.sh
  curl -s ${RAW_CONTENT_URL}/bin/update-ttl.sh > ./bin/update-ttl.sh
  curl -s ${RAW_CONTENT_URL}/bin/discord-ttl > ./bin/discord-ttl
  # PULL UPDATED DOCKER COMPOSE
  echo "${RESET}${YELLOW_TEXT}[${BOLD}TTL Updater${RESET}${YELLOW_TEXT}]${RESET}${BOLD}${BLUE_TEXT} Pulling updated docker compose...${RESET}" 
  curl -s ${RAW_CONTENT_URL}/docker-compose.yaml > ./docker-compose.yaml
  # PULL UPDATED README & .ENV EXAMPLE (I mean, why not, right?)
  echo "${RESET}${YELLOW_TEXT}[${BOLD}TTL Updater${RESET}${YELLOW_TEXT}]${RESET}${BOLD}${BLUE_TEXT} Pulling updated README & .env example...${RESET}" 
  curl -s ${RAW_CONTENT_URL}/README.md > ./README.md
  curl -s ${RAW_CONTENT_URL}/.env.example > ./.env.example
  # PULL UPDATED PACKAGE.JSON (purely so the new version is reflected)
  echo "${RESET}${YELLOW_TEXT}[${BOLD}TTL Updater${RESET}${YELLOW_TEXT}]${RESET}${BOLD}${BLUE_TEXT} Pulling updated package.json (to reflect the updated version)...${RESET}" 
  curl -s ${RAW_CONTENT_URL}/package.json > ./package.json
  if [[ $SETUP_UPDATED == true ]]; then
    echo "${RESET}${YELLOW_TEXT}[${BOLD}TTL Updater${RESET}${YELLOW_TEXT}]${RESET}${BOLD}${BLUE_TEXT} Running updated setup.sh...${RESET}" 
    source ./setup.sh
  fi
else
  echo "${RESET}${YELLOW_TEXT}[${BOLD}TTL Updater${RESET}${YELLOW_TEXT}]${RESET}${BOLD}${GREEN_TEXT} No upstream updates found. Local scripts & files should be up-to-date!${RESET}"
fi

echo "${RESET}${YELLOW_TEXT}[${BOLD}TTL Updater${RESET}${YELLOW_TEXT}]${RESET}${BOLD}${BLUE_TEXT} Pulling any new docker image(s)...${RESET}" 
docker-compose pull
echo "${RESET}${YELLOW_TEXT}[${BOLD}TTL Updater${RESET}${YELLOW_TEXT}]${RESET}${BOLD}${BLUE_TEXT} Upping container(s)...${RESET}"
docker-compose up -d
echo "${RESET}${YELLOW_TEXT}[${BOLD}TTL Updater${RESET}${YELLOW_TEXT}]${RESET}${BOLD}${GREEN_TEXT} Done! Discord TTL should now be up-to-date :)${RESET}"

# Return to whatever location this script was intitally run from for UX purposes
cd $CURRENT_DIR
