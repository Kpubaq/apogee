#!/usr/bin/env bash
# ==============================================================
# Apogee by ByKpubaq | Adil - Unix Global Setup Installer
# ==============================================================

set -e

echo -e "\033[1;36m==========================================================\033[0m"
echo -e "\033[1;35m   🛰️  INSTALLING APOGEE MISSION CONTROL  (ByKpubaq | Adil) \033[0m"
echo -e "\033[1;36m==========================================================\033[0m"

echo -e "\033[1;33m[1/4] Installing dependencies...\033[0m"
npm install

echo -e "\033[1;33m[2/4] Building TypeScript...\033[0m"
npm run build

if [ ! -f ".env" ]; then
    echo -e "\033[1;33m[3/4] Creating .env from .env.example...\033[0m"
    cp .env.example .env
fi

echo -e "\033[1;33m[4/4] Registering global 'apogee' command...\033[0m"
npm link

echo -e "\033[1;32m✔ APOGEE IS READY! Run 'apogee' in your terminal.\033[0m"
