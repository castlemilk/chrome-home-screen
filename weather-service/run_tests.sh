#!/bin/bash

echo "🧪 Running Chrome Extension Authentication Tests"
echo "================================================"

# Set test environment
export GOOGLE_API_KEY="test-key-for-auth-testing"

echo "📋 Running Go tests..."
go test -v -run TestAllAuthentication

echo ""
echo "🚀 Running individual test suites..."
go test -v -run TestExtensionRegistration
go test -v -run TestTokenValidation  
go test -v -run TestAuthMiddleware
go test -v -run TestRateLimit
go test -v -run TestSessionManagement
go test -v -run TestSecurityEdgeCases
go test -v -run TestFullAuthenticationFlow

echo ""
echo "⚡ Running performance benchmarks..."
go test -bench=BenchmarkTokenValidation -benchmem
go test -bench=BenchmarkAuthMiddleware -benchmem

echo ""
echo "📊 Test coverage report..."
go test -cover

echo ""
echo "✅ All tests completed!"