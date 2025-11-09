#!/bin/bash

# Sound CU Backend - API Test Script

BASE_URL="http://localhost:8000/v1"

echo "🧪 Sound CU Co-Pilot API Tests"
echo "=============================="
echo ""

# Test 1: Health Check
echo "1️⃣  Testing health endpoint..."
curl -s "$BASE_URL/health" | jq '.' || echo "❌ Health check failed"
echo ""

# Test 2: Login as Sarah
echo "2️⃣  Logging in as Sarah..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"sarah@example.com","password":"password123"}')

ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')

if [ "$ACCESS_TOKEN" != "null" ] && [ -n "$ACCESS_TOKEN" ]; then
    echo "✅ Login successful"
    echo "Access Token: ${ACCESS_TOKEN:0:50}..."
else
    echo "❌ Login failed"
    echo $LOGIN_RESPONSE | jq '.'
    exit 1
fi
echo ""

# Test 3: Get User Profile
echo "3️⃣  Getting user profile..."
curl -s "$BASE_URL/users/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
echo ""

# Test 4: Get Goals
echo "4️⃣  Getting goals..."
curl -s "$BASE_URL/goals" \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
echo ""

# Test 5: Get Products
echo "5️⃣  Getting products..."
curl -s "$BASE_URL/products" | jq '.'
echo ""

# Test 6: Impact Analysis
echo "6️⃣  Analyzing purchase impact ($500)..."
curl -s -X POST "$BASE_URL/goals/impact-analysis" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"purchase_amount": 500}' | jq '.'
echo ""

# Test 7: Get Recommendations
echo "7️⃣  Getting AI recommendations..."
curl -s -X POST "$BASE_URL/recommendations/get" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "purchase_context": {
      "amount": 1200,
      "merchant": "Best Buy",
      "category": "electronics"
    }
  }' | jq '.'
echo ""

echo "=============================="
echo "✅ API Tests Complete!"
echo "=============================="
