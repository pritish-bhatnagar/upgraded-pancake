#!/bin/bash
set -e

echo "🚀 Starting deployment for upgraded-pancake..."

# Load NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Navigate to project directory
cd /home/opc/upgraded-pancake

echo "📥 Pulling latest code..."
git fetch origin main
git reset --hard origin/main

echo "📦 Installing dependencies..."
# npm install is used here as it's an Angular project which might have local changes or needs a full install
npm install

echo "♻️ Restarting PM2..."
# pm2 restart will restart the process with the new code
pm2 restart upgraded-pancake

echo "✅ Deployment completed!"
pm2 list
