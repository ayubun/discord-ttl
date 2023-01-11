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
cd $SCRIPT_DIR

# ==================
#    GIT UPDATER
#  (not active atm)
# ==================
# Check if remote has any updates
# Source: https://stackoverflow.com/questions/3258243/check-if-pull-needed-in-git
# UPSTREAM=${1:-'@{u}'}
# LOCAL=$(git rev-parse @)
# REMOTE=$(git rev-parse "$UPSTREAM")
# BASE=$(git merge-base @ "$UPSTREAM")
# if [ $LOCAL != $REMOTE ] && [ $REMOTE != $BASE ]; then
#   echo "${RESET}${YELLOW_TEXT}[${BOLD}TTL Updater${RESET}${YELLOW_TEXT}]${RESET}${BOLD}${BLUE_TEXT} It looks like there are remote git changes to pull!${RESET}" 
#   echo "              Stashing & pulling from remote git server...${RESET}" 
#   # These are primarily porcelin commands, which shouldn't *technically* be used in scripts because they frequently require user intervention.
#   # Source: https://stackoverflow.com/questions/63754134/how-to-check-if-git-pull-is-successful-from-process-exitcode
#   # With that being said, I am not currently sure how to do what I want to do *without* using them, and I am okay with this script failing
#   # gracefully, since the result would simply be the updater breaking. The updater is meant to be a convenience thing for
#   # those just getting into self hosting so I'd rather have it than not, even if it breaks!
#   set +e
#   # Cancel any current rebases and/or merges
#   git rebase --abort &>/dev/null
#   git merge --abort &>/dev/null
#   # Stash any uncommitted files
#   git add --all && git stash &>/dev/null
#   # Fetch from origin
#   git fetch origin --prune &>/dev/null
#   # Reset the current branch to origin
#   git reset --hard origin &>/dev/null
#   set -e
#   # I'm actually not sure if a pull is needed after `git reset --hard origin`, but using the exit status is still useful.
#   if ! git pull --rebase; then
#     echo "${RESET}${YELLOW_TEXT}[${BOLD}TTL Updater${RESET}${YELLOW_TEXT}]${RESET}${BOLD}${RED_TEXT} Git pull failed! Unstashing and exiting :(${RESET}" 
#     git stash apply &>/dev/null
#     exit 1
#   fi
#   echo "${RESET}${YELLOW_TEXT}[${BOLD}TTL Updater${RESET}${YELLOW_TEXT}]${RESET}${BOLD}${BLUE_TEXT} Successfully rebased!${RESET}" 
#   # Now we should be up-to-date with origin's main.
#   # Re-apply anything stashed:
#   echo "${RESET}${YELLOW_TEXT}[${BOLD}TTL Updater${RESET}${YELLOW_TEXT}]${RESET}${BOLD}${BLUE_TEXT} Re-applying any stashed code...${RESET}" 
#   set +e
#   git stash apply &>/dev/null
#   set -e
#   echo "${RESET}${YELLOW_TEXT}[${BOLD}TTL Updater${RESET}${YELLOW_TEXT}]${RESET}${BOLD}${GREEN_TEXT} Git update complete!${RESET}" 
#   echo "${RESET}${YELLOW_TEXT}[${BOLD}TTL Updater${RESET}${YELLOW_TEXT}]${RESET}${BOLD}${BLUE_TEXT} Re-running ${UNDERLINE}setup.sh${RESET}${BLUE_TEXT}...${RESET}" 
#   source setup.sh
#   echo "${RESET}${YELLOW_TEXT}[${BOLD}TTL Updater${RESET}${YELLOW_TEXT}]${RESET}${BOLD}${GREEN_TEXT} ${UNDERLINE}setup.sh${RESET}${GREEN_TEXT} complete!${RESET}" 
#   # We will re-run update.sh in case it was also updated during the git repository update!
#   source update-ttl.sh
#   exit 0
# fi

echo "${RESET}${YELLOW_TEXT}[${BOLD}TTL Updater${RESET}${YELLOW_TEXT}]${RESET}${BOLD}${BLUE_TEXT} Pulling any new docker image(s)...${RESET}" 
docker-compose pull
echo "${RESET}${YELLOW_TEXT}[${BOLD}TTL Updater${RESET}${YELLOW_TEXT}]${RESET}${BOLD}${BLUE_TEXT} Upping container(s)...${RESET}"
docker-compose up -d
echo "${RESET}${YELLOW_TEXT}[${BOLD}TTL Updater${RESET}${YELLOW_TEXT}]${RESET}${BOLD}${GREEN_TEXT} Done! Discord TTL should now be up-to-date :)${RESET}"

# Return to whatever location this script was intitally run from for UX purposes
cd $CURRENT_DIR
