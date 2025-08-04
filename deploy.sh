#!/bin/bash
# Production deployment script

echo "Building application for production..."
npm run build

echo "Starting production server..."
npm run start