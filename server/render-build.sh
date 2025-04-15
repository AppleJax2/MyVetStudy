#!/bin/bash
# render-build.sh
# This script runs during the build phase on Render.com

# Exit on error
set -e

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Build the application
npm run build 