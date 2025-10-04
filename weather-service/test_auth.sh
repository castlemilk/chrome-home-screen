#\!/bin/bash

echo "🧪 Testing Chrome Extension Authentication System"
echo "================================================"

# Generate test identity
EXTENSION_ID="manual-test-$(date +%s)"
EXTENSION_VERSION="1.0.0"
FINGERPRINT="abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
TIMESTAMP=$(date +%s)000  # milliseconds
NONCE="manual-test-$(openssl rand -hex 8)"

echo "📋 Test Identity:"
echo "Extension ID: $EXTENSION_ID"
echo "Version: $EXTENSION_VERSION"
echo "Fingerprint: $FINGERPRINT"
echo

# Create token payload
PAYLOAD=$(echo -n "{\"ext\":\"$EXTENSION_ID\",\"fp\":\"$FINGERPRINT\",\"ts\":$TIMESTAMP,\"nonce\":\"$NONCE\"}" | base64)
SIGNATURE="testsignature123456789012345678901234567890"
TOKEN="${PAYLOAD}.${SIGNATURE:0:32}"

echo "🔐 Generated Token: ${TOKEN:0:50}..."
echo

# Test 1: Registration
echo "📝 Step 1: Testing Extension Registration"
echo "========================================"

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

echo "Making registration request..."
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

echo "Making validation request..."
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -H "X-Extension-Token: $TOKEN" \
  -H "X-Extension-ID: $EXTENSION_ID" \
  -H "X-Extension-Version: $EXTENSION_VERSION" \
  -H "X-Extension-Fingerprint: $FINGERPRINT" \
  -H "X-Request-ID: manual-test-validation" \
  https://weather-service-fws6uj4tlq-uc.a.run.app/api/auth/validate

echo
echo

# Test 3: Weather API Call
echo "🌤️  Step 3: Testing Weather API Call"
echo "===================================="

echo "Making authenticated weather request..."
curl -s -w "\nHTTP Status: %{http_code}\n" \
  -H "X-Extension-Token: $TOKEN" \
  -H "X-Extension-ID: $EXTENSION_ID" \
  -H "X-Extension-Version: $EXTENSION_VERSION" \
  -H "X-Extension-Fingerprint: $FINGERPRINT" \
  -H "X-Request-ID: manual-test-weather" \
  'https://weather-service-fws6uj4tlq-uc.a.run.app/api/weather?lat=40.7128&lon=-74.0060'

echo
echo

echo "✅ Authentication system testing complete\!"
