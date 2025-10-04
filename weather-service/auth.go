package main

import (
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"
)

// Extension identity and security structures
type ExtensionIdentity struct {
	ExtensionID      string `json:"extensionId"`
	ExtensionVersion string `json:"extensionVersion"`
	InstallTime      int64  `json:"installTime"`
	Fingerprint      string `json:"fingerprint"`
	UserAgent        string `json:"userAgent"`
	Timezone         string `json:"timezone"`
}

type TokenPayload struct {
	ExtensionID string `json:"ext"`
	Fingerprint string `json:"fp"`
	Timestamp   int64  `json:"ts"`
	Nonce       string `json:"nonce"`
}

type RegisterRequest struct {
	Identity  ExtensionIdentity `json:"identity"`
	Timestamp int64             `json:"timestamp"`
}

type ExtensionSession struct {
	Identity     ExtensionIdentity
	Token        string
	RegisterTime time.Time
	LastActivity time.Time
	RequestCount int64
	IsActive     bool
}

// Global extension registry with thread safety
type ExtensionRegistry struct {
	mu       sync.RWMutex
	sessions map[string]*ExtensionSession
}

var extensionRegistry = &ExtensionRegistry{
	sessions: make(map[string]*ExtensionSession),
}

// Security configuration
const (
	TOKEN_EXPIRY_HOURS  = 24
	MAX_REQUEST_PER_MIN = 120
	MAX_EXTENSIONS      = 10000
)

// Rate limiting per extension
type RateLimiter struct {
	requests map[string][]time.Time
	mu       sync.RWMutex
}

var rateLimiter = &RateLimiter{
	requests: make(map[string][]time.Time),
}

// Authentication middleware
func authMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Skip auth for health check and registration
		if r.URL.Path == "/health" || r.URL.Path == "/" || r.URL.Path == "/api/auth/register" {
			next(w, r)
			return
		}

		// Extract authentication headers
		token := r.Header.Get("X-Extension-Token")
		extensionID := r.Header.Get("X-Extension-ID")
		extensionVersion := r.Header.Get("X-Extension-Version")
		fingerprint := r.Header.Get("X-Extension-Fingerprint")
		requestID := r.Header.Get("X-Request-ID")

		// Log security event
		logSecurityEvent("AUTH_ATTEMPT", map[string]interface{}{
			"extensionId":      extensionID,
			"extensionVersion": extensionVersion,
			"fingerprint":      fingerprint,
			"requestId":        requestID,
			"endpoint":         r.URL.Path,
			"method":           r.Method,
			"userAgent":        r.Header.Get("User-Agent"),
			"timestamp":        time.Now().Unix(),
		})

		// Validate required headers
		if token == "" || extensionID == "" {
			http.Error(w, "Missing authentication headers", http.StatusUnauthorized)
			return
		}

		// Validate token format and signature
		if !validateTokenFormat(token, extensionID, fingerprint) {
			logSecurityEvent("INVALID_TOKEN", map[string]interface{}{
				"extensionId": extensionID,
				"token":       token[:min(len(token), 20)] + "...",
				"reason":      "invalid_format_or_signature",
			})
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}

		// Check if extension is registered and active
		session := getExtensionSession(extensionID)
		if session == nil || !session.IsActive {
			logSecurityEvent("UNREGISTERED_EXTENSION", map[string]interface{}{
				"extensionId": extensionID,
				"registered":  session != nil,
				"active":      session != nil && session.IsActive,
			})
			http.Error(w, "Extension not registered or inactive", http.StatusUnauthorized)
			return
		}

		// Rate limiting
		if !checkRateLimit(extensionID) {
			logSecurityEvent("RATE_LIMIT_EXCEEDED", map[string]interface{}{
				"extensionId": extensionID,
			})
			http.Error(w, "Rate limit exceeded", http.StatusTooManyRequests)
			return
		}

		// Update session activity
		updateSessionActivity(extensionID)

		// Add extension context to request
		r.Header.Set("X-Validated-Extension-ID", extensionID)
		r.Header.Set("X-Session-Valid", "true")

		next(w, r)
	}
}

// Register extension endpoint
func registerExtensionHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse registration request
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Extract and validate headers
	token := r.Header.Get("X-Extension-Token")
	extensionID := r.Header.Get("X-Extension-ID")
	extensionVersion := r.Header.Get("X-Extension-Version")

	// Validate consistency
	if req.Identity.ExtensionID != extensionID {
		logSecurityEvent("REGISTRATION_MISMATCH", map[string]interface{}{
			"headerExtensionId": extensionID,
			"bodyExtensionId":   req.Identity.ExtensionID,
		})
		http.Error(w, "Extension ID mismatch", http.StatusBadRequest)
		return
	}

	// Check if we've reached max extensions
	if len(extensionRegistry.sessions) >= MAX_EXTENSIONS {
		logSecurityEvent("MAX_EXTENSIONS_REACHED", map[string]interface{}{
			"currentCount": len(extensionRegistry.sessions),
			"maxAllowed":   MAX_EXTENSIONS,
		})
		http.Error(w, "Maximum extensions reached", http.StatusServiceUnavailable)
		return
	}

	// Create or update session
	session := &ExtensionSession{
		Identity:     req.Identity,
		Token:        token,
		RegisterTime: time.Now(),
		LastActivity: time.Now(),
		RequestCount: 0,
		IsActive:     true,
	}

	// Register the extension
	extensionRegistry.mu.Lock()
	extensionRegistry.sessions[extensionID] = session
	extensionRegistry.mu.Unlock()

	logSecurityEvent("EXTENSION_REGISTERED", map[string]interface{}{
		"extensionId":      extensionID,
		"extensionVersion": extensionVersion,
		"fingerprint":      req.Identity.Fingerprint,
		"userAgent":        req.Identity.UserAgent,
		"timezone":         req.Identity.Timezone,
	})

	// Return success response
	response := map[string]interface{}{
		"success":     true,
		"message":     "Extension registered successfully",
		"extensionId": extensionID,
		"timestamp":   time.Now().Unix(),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// Token validation endpoint
func validateTokenHandler(w http.ResponseWriter, r *http.Request) {
	extensionID := r.Header.Get("X-Validated-Extension-ID")
	sessionValid := r.Header.Get("X-Session-Valid") == "true"

	if !sessionValid || extensionID == "" {
		http.Error(w, "Invalid session", http.StatusUnauthorized)
		return
	}

	session := getExtensionSession(extensionID)
	if session == nil {
		http.Error(w, "Session not found", http.StatusUnauthorized)
		return
	}

	response := map[string]interface{}{
		"valid":        true,
		"extensionId":  extensionID,
		"registerTime": session.RegisterTime.Unix(),
		"lastActivity": session.LastActivity.Unix(),
		"requestCount": session.RequestCount,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// Validate token format and signature
func validateTokenFormat(token, extensionID, fingerprint string) bool {
	parts := strings.Split(token, ".")
	if len(parts) != 2 {
		return false
	}

	// Decode token payload
	payloadBytes, err := base64.StdEncoding.DecodeString(parts[0])
	if err != nil {
		return false
	}

	var payload TokenPayload
	if err := json.Unmarshal(payloadBytes, &payload); err != nil {
		return false
	}

	// Validate extension ID matches
	if payload.ExtensionID != extensionID {
		return false
	}

	// Validate token age (24 hours max)
	if time.Now().Unix()-payload.Timestamp > TOKEN_EXPIRY_HOURS*3600 {
		return false
	}

	// Validate signature if fingerprint provided
	if fingerprint != "" && payload.Fingerprint != fingerprint {
		return false
	}

	// Validate signature
	expectedSig := generateTokenSignature(parts[0], fingerprint)
	return parts[1] == expectedSig[:32]
}

// Generate token signature
func generateTokenSignature(tokenData, fingerprint string) string {
	data := tokenData + fingerprint
	hash := sha256.Sum256([]byte(data))
	return fmt.Sprintf("%x", hash)
}

// Get extension session
func getExtensionSession(extensionID string) *ExtensionSession {
	extensionRegistry.mu.RLock()
	defer extensionRegistry.mu.RUnlock()
	return extensionRegistry.sessions[extensionID]
}

// Update session activity
func updateSessionActivity(extensionID string) {
	extensionRegistry.mu.Lock()
	defer extensionRegistry.mu.Unlock()
	
	if session, exists := extensionRegistry.sessions[extensionID]; exists {
		session.LastActivity = time.Now()
		session.RequestCount++
	}
}

// Rate limiting check
func checkRateLimit(extensionID string) bool {
	rateLimiter.mu.Lock()
	defer rateLimiter.mu.Unlock()

	now := time.Now()
	oneMinuteAgo := now.Add(-time.Minute)

	// Initialize if not exists
	if rateLimiter.requests[extensionID] == nil {
		rateLimiter.requests[extensionID] = []time.Time{}
	}

	// Remove old requests
	requests := rateLimiter.requests[extensionID]
	validRequests := []time.Time{}
	for _, req := range requests {
		if req.After(oneMinuteAgo) {
			validRequests = append(validRequests, req)
		}
	}

	// Check if under limit
	if len(validRequests) >= MAX_REQUEST_PER_MIN {
		return false
	}

	// Add current request
	validRequests = append(validRequests, now)
	rateLimiter.requests[extensionID] = validRequests

	return true
}

// Security event logging
func logSecurityEvent(eventType string, data map[string]interface{}) {
	data["eventType"] = eventType
	data["serverTime"] = time.Now().UTC().Format(time.RFC3339)
	
	jsonData, _ := json.Marshal(data)
	log.Printf("SECURITY_EVENT: %s", string(jsonData))
}

// Extension statistics endpoint
func extensionStatsHandler(w http.ResponseWriter, r *http.Request) {
	extensionID := r.Header.Get("X-Validated-Extension-ID")
	
	if extensionID == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	session := getExtensionSession(extensionID)
	if session == nil {
		http.Error(w, "Session not found", http.StatusNotFound)
		return
	}

	stats := map[string]interface{}{
		"extensionId":      session.Identity.ExtensionID,
		"extensionVersion": session.Identity.ExtensionVersion,
		"registerTime":     session.RegisterTime.Unix(),
		"lastActivity":     session.LastActivity.Unix(),
		"requestCount":     session.RequestCount,
		"uptime":           time.Since(session.RegisterTime).Seconds(),
		"isActive":         session.IsActive,
		"fingerprint":      session.Identity.Fingerprint,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}

// Cleanup inactive sessions
func cleanupInactiveSessions() {
	ticker := time.NewTicker(1 * time.Hour)
	go func() {
		for range ticker.C {
			extensionRegistry.mu.Lock()
			now := time.Now()
			for extensionID, session := range extensionRegistry.sessions {
				// Remove sessions inactive for more than 7 days
				if now.Sub(session.LastActivity) > 7*24*time.Hour {
					delete(extensionRegistry.sessions, extensionID)
					logSecurityEvent("SESSION_EXPIRED", map[string]interface{}{
						"extensionId":  extensionID,
						"lastActivity": session.LastActivity.Unix(),
					})
				}
			}
			extensionRegistry.mu.Unlock()
		}
	}()
}

// Helper function
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}