#!/bin/bash

# Test script for disabled folders functionality
# Usage: bash test-disabled-folders.sh

API="http://localhost:5000/api"
USER_ID="user_123"
ACCOUNT_ID="account_test"

echo "=== Testing Disabled Folders Sync ==="
echo ""

# 1. Get all folders
echo "1. Getting all folders..."
FOLDERS=$(curl -s -X GET "${API}/mail/folders/${ACCOUNT_ID}" \
  -H "X-User-ID: ${USER_ID}")

echo "Folders (before):"
echo "${FOLDERS}" | jq '.[] | {id, folder_name, is_visible}' || echo "No folders yet"
echo ""

# 2. Disable a folder
echo "2. Disabling a folder..."
FOLDER_ID=$(echo "${FOLDERS}" | jq -r '.[0].id' 2>/dev/null)

if [ ! -z "${FOLDER_ID}" ] && [ "${FOLDER_ID}" != "null" ]; then
  curl -s -X PUT "${API}/mail/folders/${FOLDER_ID}" \
    -H "X-User-ID: ${USER_ID}" \
    -H "Content-Type: application/json" \
    -d '{"isVisible": false}' | jq .
  echo ""
  
  # 3. Get folders again
  echo "3. Getting folders after disabling..."
  FOLDERS=$(curl -s -X GET "${API}/mail/folders/${ACCOUNT_ID}" \
    -H "X-User-ID: ${USER_ID}")
  
  echo "Folders (after):"
  echo "${FOLDERS}" | jq '.[] | {id, folder_name, is_visible}'
  echo ""
  
  # 4. Start sync
  echo "4. Starting sync (disabled folder should be skipped)..."
  echo "Watch backend logs for: '[MailSync] Skipping disabled folder'"
  curl -s -X POST "${API}/mail/accounts/${ACCOUNT_ID}/sync" \
    -H "X-User-ID: ${USER_ID}" \
    -w "\nStatus: %{http_code}\n"
  echo ""
  
  # 5. Re-enable folder
  echo "5. Re-enabling folder..."
  curl -s -X PUT "${API}/mail/folders/${FOLDER_ID}" \
    -H "X-User-ID: ${USER_ID}" \
    -H "Content-Type: application/json" \
    -d '{"isVisible": true}' | jq '.folder_name, .is_visible'
  
else
  echo "No folders found. Create folders first."
fi

echo ""
echo "=== Test Complete ==="
