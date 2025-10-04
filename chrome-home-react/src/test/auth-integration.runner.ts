/**
 * Chrome Extension Authentication Integration Tests
 * Tests the full flow from extension authentication to server validation
 */

import authService from '../services/auth'

interface TestResult {
  success: boolean
  message: string
  data?: any
  error?: string
}

class AuthIntegrationTester {
  private baseUrl = 'http://localhost:8080/api'
  private testResults: TestResult[] = []

  async runAllTests(): Promise<void> {
    console.log('🧪 Starting Chrome Extension Authentication Integration Tests')
    console.log('===========================================================')

    try {
      await this.testTokenGeneration()
      await this.testExtensionRegistration() 
      await this.testTokenValidation()
      await this.testAuthenticatedRequest()
      await this.testRateLimit()
      await this.testTokenRefresh()
      await this.testErrorHandling()
      
      this.printResults()
    } catch (error) {
      console.error('❌ Test suite failed:', error)
    }
  }

  private async testTokenGeneration(): Promise<void> {
    console.log('📋 Test 1: Token Generation')
    
    try {
      // Clear existing auth data
      await authService.clearAuth()
      
      // Generate new token
      const { token, identity } = await authService.getAuthToken()
      
      if (!token || !identity) {
        throw new Error('Token or identity not generated')
      }
      
      // Validate token format
      const parts = token.split('.')
      if (parts.length !== 2) {
        throw new Error('Invalid token format')
      }
      
      // Validate identity fields
      const requiredFields = ['extensionId', 'extensionVersion', 'installTime', 'fingerprint']
      for (const field of requiredFields) {
        if (!identity[field as keyof typeof identity]) {
          throw new Error(`Missing identity field: ${field}`)
        }
      }
      
      this.testResults.push({
        success: true,
        message: 'Token generation successful',
        data: { tokenLength: token.length, extensionId: identity.extensionId }
      })
      
    } catch (error) {
      this.testResults.push({
        success: false,
        message: 'Token generation failed',
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  private async testExtensionRegistration(): Promise<void> {
    console.log('📋 Test 2: Extension Registration with Backend')
    
    try {
      const { token, identity } = await authService.getAuthToken()
      
      const response = await fetch(`${this.baseUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Extension-Token': token,
          'X-Extension-ID': identity.extensionId,
          'X-Extension-Version': identity.extensionVersion
        },
        body: JSON.stringify({
          identity,
          timestamp: Date.now()
        })
      })
      
      if (!response.ok) {
        throw new Error(`Registration failed: ${response.status} ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error('Registration response indicates failure')
      }
      
      this.testResults.push({
        success: true,
        message: 'Extension registration successful',
        data: result
      })
      
    } catch (error) {
      this.testResults.push({
        success: false,
        message: 'Extension registration failed',
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  private async testTokenValidation(): Promise<void> {
    console.log('📋 Test 3: Token Validation')
    
    try {
      const response = await authService.authenticatedFetch(`${this.baseUrl}/auth/validate`)
      
      if (!response.ok) {
        throw new Error(`Token validation failed: ${response.status}`)
      }
      
      const result = await response.json()
      
      if (!result.valid) {
        throw new Error('Token validation returned invalid')
      }
      
      this.testResults.push({
        success: true,
        message: 'Token validation successful',
        data: result
      })
      
    } catch (error) {
      this.testResults.push({
        success: false,
        message: 'Token validation failed',
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  private async testAuthenticatedRequest(): Promise<void> {
    console.log('📋 Test 4: Authenticated Weather API Request')
    
    try {
      // Test making an authenticated API request
      const response = await authService.authenticatedFetch(
        `${this.baseUrl}/weather?lat=40.7128&lon=-74.0060`
      )
      
      // Note: This might fail due to missing Google API key, but auth should pass
      if (response.status === 401) {
        throw new Error('Authentication failed for weather request')
      }
      
      this.testResults.push({
        success: true,
        message: 'Authenticated API request successful (auth passed)',
        data: { status: response.status, statusText: response.statusText }
      })
      
    } catch (error) {
      this.testResults.push({
        success: false,
        message: 'Authenticated API request failed',
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  private async testRateLimit(): Promise<void> {
    console.log('📋 Test 5: Rate Limiting')
    
    try {
      // Make multiple requests quickly to test rate limiting
      const requests = []
      for (let i = 0; i < 10; i++) {
        requests.push(
          authService.authenticatedFetch(`${this.baseUrl}/auth/validate`)
        )
      }
      
      const responses = await Promise.all(requests)
      const successCount = responses.filter(r => r.ok).length
      
      if (successCount === 0) {
        throw new Error('All rate limit test requests failed')
      }
      
      this.testResults.push({
        success: true,
        message: 'Rate limiting test passed',
        data: { successfulRequests: successCount, totalRequests: requests.length }
      })
      
    } catch (error) {
      this.testResults.push({
        success: false,
        message: 'Rate limiting test failed',
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  private async testTokenRefresh(): Promise<void> {
    console.log('📋 Test 6: Token Refresh')
    
    try {
      const originalToken = await authService.getAuthToken()
      
      // Force token refresh
      const refreshedToken = await authService.refreshToken()
      
      if (refreshedToken.token === originalToken.token) {
        throw new Error('Token was not refreshed')
      }
      
      // Validate new token works
      const isValid = await authService.validateToken()
      
      if (!isValid) {
        throw new Error('Refreshed token is not valid')
      }
      
      this.testResults.push({
        success: true,
        message: 'Token refresh successful',
        data: { tokenChanged: true, newTokenValid: isValid }
      })
      
    } catch (error) {
      this.testResults.push({
        success: false,
        message: 'Token refresh failed',
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  private async testErrorHandling(): Promise<void> {
    console.log('📋 Test 7: Error Handling')
    
    try {
      // Test request with invalid token
      const response = await fetch(`${this.baseUrl}/auth/validate`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Extension-Token': 'invalid.token',
          'X-Extension-ID': 'invalid-id',
          'X-Extension-Version': '1.0.0'
        }
      })
      
      if (response.ok) {
        throw new Error('Invalid token should be rejected')
      }
      
      if (response.status !== 401) {
        throw new Error(`Expected 401 Unauthorized, got ${response.status}`)
      }
      
      this.testResults.push({
        success: true,
        message: 'Error handling works correctly',
        data: { rejectedInvalidToken: true, statusCode: response.status }
      })
      
    } catch (error) {
      this.testResults.push({
        success: false,
        message: 'Error handling test failed',
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  private printResults(): void {
    console.log('\n📊 Integration Test Results')
    console.log('============================')
    
    let passed = 0
    let failed = 0
    
    this.testResults.forEach((result, index) => {
      const status = result.success ? '✅ PASS' : '❌ FAIL'
      console.log(`${index + 1}. ${status}: ${result.message}`)
      
      if (result.data) {
        console.log(`   Data: ${JSON.stringify(result.data, null, 2)}`)
      }
      
      if (result.error) {
        console.log(`   Error: ${result.error}`)
      }
      
      if (result.success) passed++
      else failed++
    })
    
    console.log('\n🎯 Summary')
    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`📈 Success Rate: ${((passed / this.testResults.length) * 100).toFixed(1)}%`)
    
    if (failed === 0) {
      console.log('\n🎉 All integration tests passed!')
    } else {
      console.log('\n⚠️  Some tests failed - check the output above')
    }
  }
}

// Export test runner
export async function runAuthIntegrationTests(): Promise<void> {
  const tester = new AuthIntegrationTester()
  await tester.runAllTests()
}

// Auto-run if this is the main module (for development)
if (typeof window !== 'undefined' && (window as any).runAuthTests) {
  runAuthIntegrationTests().catch(console.error)
}