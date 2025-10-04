#\!/bin/bash

echo "🧪 Testing Chrome Extension Authentication with Proper Signatures"
echo "=================================================================="

# Generate test identity
EXTENSION_ID="proper-test-$(date +%s)"
EXTENSION_VERSION="1.0.0"
FINGERPRINT="abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
TIMESTAMP=$(date +%s)000  # milliseconds
NONCE="proper-test-$(openssl rand -hex 8)"

echo "📋 Test Identity:"
echo "Extension ID: $EXTENSION_ID"
echo "Version: $EXTENSION_VERSION"
echo "Fingerprint: $FINGERPRINT"
echo

# Create token payload
PAYLOAD_JSON="{\"ext\":\"$EXTENSION_ID\",\"fp\":\"$FINGERPRINT\",\"ts\":$TIMESTAMP,\"nonce\":\"$NONCE\"}"
PAYLOAD=$(echo -n "$PAYLOAD_JSON" | base64)

# Generate proper signature using the same method as Go backend (SHA256)
DATA_TO_SIGN="${PAYLOAD}${FINGERPRINT}"
SIGNATURE=$(echo -n "$DATA_TO_SIGN" | openssl dgst -sha256 -hex | cut -d' ' -f2 | head -c 32)
TOKEN="${PAYLOAD}.${SIGNATURE}"

echo "🔐 Generated Token with SHA256 signature: ${TOKEN:0:50}..."
echo

# Create identity JSON
IDENTITY="{
  \"extensionId\": \"$EXTENSION_ID\",
  \"extensionVersion\": \"$EXTENSION_VERSION\",
  \"installTime\": $TIMESTAMP,
  \"fingerprint\": \"$FINGERPRINT\",
  \"userAgent\": \"Mozilla/5.0 Chrome/xxx Safari/xxx\",
  \"timezone\": \"America/New_York\"
}"

REGISTER_PAYLOAD="{
  \"identity\": $IDENTITY,
  \"timestamp\": $TIMESTAMP
}"

# Test 1: Registration
echo "📝 Step 1: Testing Extension Registration"
echo "========================================"
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "X-Extension-Token: $TOKEN" \
  -H "X-Extension-ID: $EXTENSION_ID" \
  -H "X-Extension-Version: $EXTENSION_VERSION" \
  -d "$REGISTER_PAYLOAD" \
  https://weather-service-fws6uj4tlq-uc.a.run.app/api/auth/register

echo
echo

# Test 2: Token Validation
echo "🔍 Step 2: Testing Token Validation"
echo "==================================="
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -H "X-Extension-Token: $TOKEN" \
  -H "X-Extension-ID: $EXTENSION_ID" \
  -H "X-Extension-Version: $EXTENSION_VERSION" \
  -H "X-Extension-Fingerprint: $FINGERPRINT" \
  -H "X-Request-ID: proper-test-validation" \
  https://weather-service-fws6uj4tlq-uc.a.run.app/api/auth/validate

echo
echo

# Test 3: Weather API Call
echo "🌤️  Step 3: Testing Weather API Call"
echo "===================================="
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -H "X-Extension-Token: $TOKEN" \
  -H "X-Extension-ID: $EXTENSION_ID" \
  -H "X-Extension-Version: $EXTENSION_VERSION" \
  -H "X-Extension-Fingerprint: $FINGERPRINT" \
  -H "X-Request-ID: proper-test-weather" \
  'https://weather-service-fws6uj4tlq-uc.a.run.app/api/weather?lat=40.7128&lon=-74.0060' | head -c 500

echo "... (truncated)"
echo

echo "✅ Authentication system testing with proper signatures complete\!"
