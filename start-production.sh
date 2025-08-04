#!/bin/bash

# Production startup script for Replit deployment
echo "Starting production deployment..."

# Build the application
echo "Building application..."
npm run build

# Check if build was successful
if [ $? -ne 0 ]; then
    echo "Build failed, exiting..."
    exit 1
fi

# Start the production server
echo "Starting production server..."
NODE_ENV=production node dist/index.js