#!/bin/bash

# TEAM CCTV Platform - Security Audit Script
# Version 1.0.0

echo "🔍 Starting Security Audit..."

# 1. NPM Audit
echo "📦 Checking NPM dependencies for vulnerabilities..."
npm audit --audit-level=high

# 2. Basic Secret Scanning (Looking for common patterns)
echo "🛡️ Scanning for accidental secrets..."
grep -rE "AIza[0-9A-Za-z-_]{35}" . --exclude-dir={node_modules,.next,.git} && echo "⚠️ Potential Firebase API Key found!" || echo "✅ No obvious secrets found in source."

# 3. Firestore Rules Validation (Syntax only)
echo "🔥 Validating Firestore Security Rules..."
# Note: Requires firebase-tools installed
if command -v firebase &> /dev/null
then
    firebase deploy --only firestore:rules --dry-run
else
    echo "⏭️ Firebase CLI not found. Skipping rules validation."
fi

echo "✅ Security Audit Complete."
