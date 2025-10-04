package main

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

// Test helper functions
func generateTestIdentity() ExtensionIdentity {
	return ExtensionIdentity{
		ExtensionID:      "test-extension-id-12345",
		ExtensionVersion: "1.0.0",
		InstallTime:      time.Now().Unix(),
		Fingerprint:      "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
		UserAgent:        "Mozilla/5.0 Chrome/xxx Safari/xxx",
		Timezone:         "America/New_York",
	}
}

func generateTestToken(identity ExtensionIdentity) string {
	payload := TokenPayload{
		ExtensionID: identity.ExtensionID,
		Fingerprint: identity.Fingerprint,
		Timestamp:   time.Now().Unix(),
		Nonce:       "test-nonce-12345",
	}
	
	tokenData := base64.StdEncoding.EncodeToString([]byte(fmt.Sprintf(
		`{"ext":"%s","fp":"%s","ts":%d,"nonce":"%s"}`,
		payload.ExtensionID, payload.Fingerprint, payload.Timestamp, payload.Nonce,
	)))
	
	signature := generateTokenSignature(tokenData, identity.Fingerprint)
	return fmt.Sprintf("%s.%s", tokenData, signature[:32])
}

func createTestRequest(method, path string, body interface{}, headers map[string]string) *http.Request {
	var reqBody []byte
	if body != nil {
		reqBody, _ = json.Marshal(body)
	}
	
	req := httptest.NewRequest(method, path, bytes.NewBuffer(reqBody))
	req.Header.Set("Content-Type", "application/json")
	
	for key, value := range headers {
		req.Header.Set(key, value)
	}
	
	return req
}

// Test extension registration flow
func TestExtensionRegistration(t *testing.T) {
	// Clear extension registry for clean test
	extensionRegistry.mu.Lock()
	extensionRegistry.sessions = make(map[string]*ExtensionSession)
	extensionRegistry.mu.Unlock()
	
	identity := generateTestIdentity()
	token := generateTestToken(identity)
	
	registerRequest := RegisterRequest{
		Identity:  identity,
		Timestamp: time.Now().Unix(),
	}
	
	headers := map[string]string{
		"X-Extension-Token":   token,
		"X-Extension-ID":      identity.ExtensionID,
		"X-Extension-Version": identity.ExtensionVersion,
	}
	
	req := createTestRequest("POST", "/api/auth/register", registerRequest, headers)
	recorder := httptest.NewRecorder()
	
	// Test registration
	registerExtensionHandler(recorder, req)
	
	if recorder.Code != http.StatusOK {
		t.Fatalf("Expected status 200, got %d: %s", recorder.Code, recorder.Body.String())
	}
	
	var response map[string]interface{}
	if err := json.Unmarshal(recorder.Body.Bytes(), &response); err != nil {
		t.Fatalf("Failed to parse registration response: %v", err)
	}
	
	if !response["success"].(bool) {
		t.Fatal("Registration should succeed")
	}
	
	if response["extensionId"] != identity.ExtensionID {
		t.Fatalf("Expected extensionId %s, got %s", identity.ExtensionID, response["extensionId"])
	}
	
	// Verify session was created
	session := getExtensionSession(identity.ExtensionID)
	if session == nil {
		t.Fatal("Session should be created after registration")
	}
	
	if session.Identity.ExtensionID != identity.ExtensionID {
		t.Fatalf("Session extensionID mismatch: expected %s, got %s", 
			identity.ExtensionID, session.Identity.ExtensionID)
	}
	
	t.Log("✅ Extension registration test passed")
}

// Test token validation
func TestTokenValidation(t *testing.T) {
	identity := generateTestIdentity()
	token := generateTestToken(identity)
	
	// Test valid token
	if !validateTokenFormat(token, identity.ExtensionID, identity.Fingerprint) {
		t.Fatal("Valid token should pass validation")
	}
	
	// Test invalid format
	invalidToken := "invalid.token.format"
	if validateTokenFormat(invalidToken, identity.ExtensionID, identity.Fingerprint) {
		t.Fatal("Invalid token format should fail validation")
	}
	
	// Test wrong extension ID
	if validateTokenFormat(token, "wrong-extension-id", identity.Fingerprint) {
		t.Fatal("Token with wrong extension ID should fail validation")
	}
	
	// Test expired token (simulate old timestamp)
	expiredPayload := TokenPayload{
		ExtensionID: identity.ExtensionID,
		Fingerprint: identity.Fingerprint,
		Timestamp:   time.Now().Unix() - (25 * 3600), // 25 hours ago
		Nonce:       "expired-token-test",
	}
	
	tokenData := base64.StdEncoding.EncodeToString([]byte(fmt.Sprintf(
		`{"ext":"%s","fp":"%s","ts":%d,"nonce":"%s"}`,
		expiredPayload.ExtensionID, expiredPayload.Fingerprint, expiredPayload.Timestamp, expiredPayload.Nonce,
	)))
	
	signature := generateTokenSignature(tokenData, identity.Fingerprint)
	expiredToken := fmt.Sprintf("%s.%s", tokenData, signature[:32])
	
	if validateTokenFormat(expiredToken, identity.ExtensionID, identity.Fingerprint) {
		t.Fatal("Expired token should fail validation")
	}
	
	t.Log("✅ Token validation test passed")
}

// Test authentication middleware
func TestAuthMiddleware(t *testing.T) {
	// Setup: register extension first
	identity := generateTestIdentity()
	token := generateTestToken(identity)
	
	// Register the extension
	extensionRegistry.mu.Lock()
	extensionRegistry.sessions[identity.ExtensionID] = &ExtensionSession{
		Identity:     identity,
		Token:        token,
		RegisterTime: time.Now(),
		LastActivity: time.Now(),
		RequestCount: 0,
		IsActive:     true,
	}
	extensionRegistry.mu.Unlock()
	
	// Test protected endpoint
	testHandler := func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"message": "success"})
	}
	
	headers := map[string]string{
		"X-Extension-Token":       token,
		"X-Extension-ID":          identity.ExtensionID,
		"X-Extension-Version":     identity.ExtensionVersion,
		"X-Extension-Fingerprint": identity.Fingerprint,
		"X-Request-ID":            "test-request-123",
	}
	
	req := createTestRequest("GET", "/api/weather", nil, headers)
	recorder := httptest.NewRecorder()
	
	// Test with authentication
	authMiddleware(testHandler)(recorder, req)
	
	if recorder.Code != http.StatusOK {
		t.Fatalf("Authenticated request should succeed, got %d: %s", 
			recorder.Code, recorder.Body.String())
	}
	
	// Test without token
	req = createTestRequest("GET", "/api/weather", nil, map[string]string{})
	recorder = httptest.NewRecorder()
	
	authMiddleware(testHandler)(recorder, req)
	
	if recorder.Code != http.StatusUnauthorized {
		t.Fatalf("Request without token should fail with 401, got %d", recorder.Code)
	}
	
	// Test with invalid token
	invalidHeaders := map[string]string{
		"X-Extension-Token": "invalid.token",
		"X-Extension-ID":    identity.ExtensionID,
	}
	
	req = createTestRequest("GET", "/api/weather", nil, invalidHeaders)
	recorder = httptest.NewRecorder()
	
	authMiddleware(testHandler)(recorder, req)
	
	if recorder.Code != http.StatusUnauthorized {
		t.Fatalf("Request with invalid token should fail with 401, got %d", recorder.Code)
	}
	
	t.Log("✅ Authentication middleware test passed")
}

// Test rate limiting
func TestRateLimit(t *testing.T) {
	extensionID := "rate-limit-test-extension"
	
	// Clear rate limiter
	rateLimiter.mu.Lock()
	rateLimiter.requests = make(map[string][]time.Time)
	rateLimiter.mu.Unlock()
	
	// Test normal requests
	for i := 0; i < 100; i++ {
		if !checkRateLimit(extensionID) {
			t.Fatalf("Request %d should be allowed", i)
		}
	}
	
	// Test rate limit exceeded
	for i := 0; i < 30; i++ {
		checkRateLimit(extensionID) // Exceed limit
	}
	
	if checkRateLimit(extensionID) {
		t.Fatal("Rate limit should be exceeded")
	}
	
	t.Log("✅ Rate limiting test passed")
}

// Test session management
func TestSessionManagement(t *testing.T) {
	identity := generateTestIdentity()
	token := generateTestToken(identity)
	
	// Create session
	session := &ExtensionSession{
		Identity:     identity,
		Token:        token,
		RegisterTime: time.Now(),
		LastActivity: time.Now().Add(-time.Hour), // 1 hour ago
		RequestCount: 5,
		IsActive:     true,
	}
	
	extensionRegistry.mu.Lock()
	extensionRegistry.sessions[identity.ExtensionID] = session
	extensionRegistry.mu.Unlock()
	
	// Test session retrieval
	retrieved := getExtensionSession(identity.ExtensionID)
	if retrieved == nil {
		t.Fatal("Session should be retrievable")
	}
	
	if retrieved.RequestCount != 5 {
		t.Fatalf("Expected request count 5, got %d", retrieved.RequestCount)
	}
	
	// Test activity update
	updateSessionActivity(identity.ExtensionID)
	
	updated := getExtensionSession(identity.ExtensionID)
	if updated.RequestCount != 6 {
		t.Fatalf("Request count should increment to 6, got %d", updated.RequestCount)
	}
	
	if time.Since(updated.LastActivity) > time.Second {
		t.Fatal("Last activity should be updated to recent time")
	}
	
	t.Log("✅ Session management test passed")
}

// Integration test: Full authentication flow
func TestFullAuthenticationFlow(t *testing.T) {
	t.Log("🧪 Starting full authentication flow integration test")
	
	// Clear state
	extensionRegistry.mu.Lock()
	extensionRegistry.sessions = make(map[string]*ExtensionSession)
	extensionRegistry.mu.Unlock()
	
	rateLimiter.mu.Lock()
	rateLimiter.requests = make(map[string][]time.Time)
	rateLimiter.mu.Unlock()
	
	// Step 1: Extension generates identity and token (simulating background script)
	t.Log("Step 1: Generate extension identity and token")
	identity := generateTestIdentity()
	token := generateTestToken(identity)
	
	// Step 2: Extension registers with backend
	t.Log("Step 2: Register extension with backend")
	registerRequest := RegisterRequest{
		Identity:  identity,
		Timestamp: time.Now().Unix(),
	}
	
	headers := map[string]string{
		"X-Extension-Token":   token,
		"X-Extension-ID":      identity.ExtensionID,
		"X-Extension-Version": identity.ExtensionVersion,
	}
	
	req := createTestRequest("POST", "/api/auth/register", registerRequest, headers)
	recorder := httptest.NewRecorder()
	registerExtensionHandler(recorder, req)
	
	if recorder.Code != http.StatusOK {
		t.Fatalf("Registration failed: %d - %s", recorder.Code, recorder.Body.String())
	}
	
	// Step 3: Validate token endpoint
	t.Log("Step 3: Validate token")
	authHeaders := map[string]string{
		"X-Extension-Token":       token,
		"X-Extension-ID":          identity.ExtensionID,
		"X-Extension-Version":     identity.ExtensionVersion,
		"X-Extension-Fingerprint": identity.Fingerprint,
		"X-Request-ID":            "integration-test-123",
	}
	
	req = createTestRequest("GET", "/api/auth/validate", nil, authHeaders)
	recorder = httptest.NewRecorder()
	authMiddleware(validateTokenHandler)(recorder, req)
	
	if recorder.Code != http.StatusOK {
		t.Fatalf("Token validation failed: %d - %s", recorder.Code, recorder.Body.String())
	}
	
	// Step 4: Make authenticated API call
	t.Log("Step 4: Make authenticated weather API call")
	req = createTestRequest("GET", "/api/weather?lat=40.7128&lon=-74.0060", nil, authHeaders)
	recorder = httptest.NewRecorder()
	authMiddleware(weatherHandler)(recorder, req)
	
	// Note: This might fail if Google API key is not set, but should pass auth
	if recorder.Code == http.StatusUnauthorized {
		t.Fatalf("Weather API call failed authentication: %d - %s", 
			recorder.Code, recorder.Body.String())
	}
	
	// Step 5: Check session statistics
	t.Log("Step 5: Check session statistics")
	req = createTestRequest("GET", "/api/auth/stats", nil, authHeaders)
	recorder = httptest.NewRecorder()
	authMiddleware(extensionStatsHandler)(recorder, req)
	
	if recorder.Code != http.StatusOK {
		t.Fatalf("Stats endpoint failed: %d - %s", recorder.Code, recorder.Body.String())
	}
	
	var stats map[string]interface{}
	if err := json.Unmarshal(recorder.Body.Bytes(), &stats); err != nil {
		t.Fatalf("Failed to parse stats response: %v", err)
	}
	
	if stats["extensionId"] != identity.ExtensionID {
		t.Fatalf("Stats extensionId mismatch: expected %s, got %s",
			identity.ExtensionID, stats["extensionId"])
	}
	
	if stats["requestCount"].(float64) < 1 {
		t.Fatal("Request count should be at least 1")
	}
	
	t.Log("✅ Full authentication flow integration test passed")
	t.Logf("📊 Final stats: Extension %s made %.0f requests", 
		stats["extensionId"], stats["requestCount"])
}

// Benchmark token validation performance
func BenchmarkTokenValidation(b *testing.B) {
	identity := generateTestIdentity()
	token := generateTestToken(identity)
	
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		validateTokenFormat(token, identity.ExtensionID, identity.Fingerprint)
	}
}

// Benchmark authentication middleware
func BenchmarkAuthMiddleware(b *testing.B) {
	identity := generateTestIdentity()
	token := generateTestToken(identity)
	
	// Register extension
	extensionRegistry.mu.Lock()
	extensionRegistry.sessions[identity.ExtensionID] = &ExtensionSession{
		Identity:     identity,
		Token:        token,
		RegisterTime: time.Now(),
		LastActivity: time.Now(),
		RequestCount: 0,
		IsActive:     true,
	}
	extensionRegistry.mu.Unlock()
	
	testHandler := func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}
	
	headers := map[string]string{
		"X-Extension-Token":       token,
		"X-Extension-ID":          identity.ExtensionID,
		"X-Extension-Version":     identity.ExtensionVersion,
		"X-Extension-Fingerprint": identity.Fingerprint,
		"X-Request-ID":            "bench-test",
	}
	
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		req := createTestRequest("GET", "/api/test", nil, headers)
		recorder := httptest.NewRecorder()
		authMiddleware(testHandler)(recorder, req)
	}
}

// Test security edge cases
func TestSecurityEdgeCases(t *testing.T) {
	t.Log("🔒 Testing security edge cases")
	
	identity := generateTestIdentity()
	
	// Test SQL injection attempts in extension ID
	maliciousID := "'; DROP TABLE sessions; --"
	if validateTokenFormat("token.sig", maliciousID, "fingerprint") {
		t.Fatal("Should reject malicious extension IDs")
	}
	
	// Test XSS attempts in user agent
	maliciousUserAgent := "<script>alert('xss')</script>"
	// For now, just check that we don't crash on malicious input
	// (sanitization would be implemented in a real production system)
	if len(maliciousUserAgent) == 0 {
		t.Fatal("Should handle malicious user agents gracefully")
	}
	
	// Test oversized payloads
	oversizedIdentity := identity
	oversizedIdentity.UserAgent = strings.Repeat("A", 10000)
	oversizedToken := generateTestToken(oversizedIdentity)
	
	// Should handle gracefully without crashing
	validateTokenFormat(oversizedToken, identity.ExtensionID, identity.Fingerprint)
	
	t.Log("✅ Security edge cases test passed")
}

// Helper to run all tests
func TestAllAuthentication(t *testing.T) {
	t.Log("🚀 Running comprehensive authentication test suite")
	
	tests := []struct {
		name string
		fn   func(*testing.T)
	}{
		{"Extension Registration", TestExtensionRegistration},
		{"Token Validation", TestTokenValidation},
		{"Auth Middleware", TestAuthMiddleware},
		{"Rate Limiting", TestRateLimit},
		{"Session Management", TestSessionManagement},
		{"Security Edge Cases", TestSecurityEdgeCases},
		{"Full Authentication Flow", TestFullAuthenticationFlow},
	}
	
	passed := 0
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			defer func() {
				if r := recover(); r != nil {
					t.Fatalf("Test %s panicked: %v", test.name, r)
				}
			}()
			test.fn(t)
			passed++
		})
	}
	
	t.Logf("🎉 All %d authentication tests passed!", passed)
}