#!/bin/bash
# render-build.sh
# This script runs during the build phase on Render.com

# Exit on error
set -e

# Print commands before execution
set -x

# Install dependencies
npm install

# Clear any existing generated Prisma client
rm -rf generated/prisma || true

# Generate Prisma client
npx prisma generate

# Verify Prisma client was generated
ls -la generated/prisma

# Build the application with type checking bypass for deployment
npm run build:bypass

# Verify the build completed
ls -la dist 