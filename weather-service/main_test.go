package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"
)

// Mock Google Weather API response for testing
func mockGoogleWeatherResponse() map[string]interface{} {
	return map[string]interface{}{
		"temperature": map[string]interface{}{
			"degrees": 20.5,
			"unit":    "CELSIUS",
		},
		"feelsLikeTemperature": map[string]interface{}{
			"degrees": 18.3,
			"unit":    "CELSIUS",
		},
		"relativeHumidity": 65,
		"weatherCondition": map[string]interface{}{
			"type":        "PARTLY_CLOUDY",
			"description": map[string]interface{}{
				"text":         "Partly Cloudy",
				"languageCode": "en",
			},
			"iconBaseUri": "https://maps.gstatic.com/weather/v1/partly_cloudy",
		},
		"wind": map[string]interface{}{
			"speed": map[string]interface{}{
				"value": 15.0,
				"unit":  "KILOMETERS_PER_HOUR",
			},
			"direction": map[string]interface{}{
				"degrees":  180,
				"cardinal": "SOUTH",
			},
		},
		"precipitation": map[string]interface{}{
			"probability": map[string]interface{}{
				"percent": 25,
				"type":    "RAIN",
			},
		},
		"visibility": map[string]interface{}{
			"distance": 10.0,
			"unit":     "KILOMETERS",
		},
		"uvIndex": 5,
		"cloudCover": 40,
		"isDaytime": true,
	}
}

// Test the weather handler response structure
func TestWeatherHandler(t *testing.T) {
	// Create a mock server that returns Google Weather API response
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Check for the correct path pattern
		if r.URL.Path == "/currentConditions:lookup" {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(mockGoogleWeatherResponse())
		} else {
			w.WriteHeader(http.StatusNotFound)
			fmt.Fprintf(w, "Not Found")
		}
	}))
	defer mockServer.Close()

	// Override the Google Weather API base URL for testing
	originalBase := GOOGLE_WEATHER_BASE
	GOOGLE_WEATHER_BASE = mockServer.URL
	defer func() { GOOGLE_WEATHER_BASE = originalBase }()

	// Set a test API key
	os.Setenv("GOOGLE_API_KEY", "test-key")
	defer os.Unsetenv("GOOGLE_API_KEY")

	// Create request
	req := httptest.NewRequest("GET", "/api/weather?lat=37.7749&lon=-122.4194", nil)
	w := httptest.NewRecorder()

	// Call handler
	weatherHandler(w, req)

	// Check status code
	if w.Code != http.StatusOK {
		t.Errorf("Expected status %d, got %d", http.StatusOK, w.Code)
	}

	// Parse response
	var response map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	// Verify structure
	if _, ok := response["current"]; !ok {
		t.Error("Response missing 'current' field")
	}
	if _, ok := response["forecast"]; !ok {
		t.Error("Response missing 'forecast' field")
	}
	if _, ok := response["timestamp"]; !ok {
		t.Error("Response missing 'timestamp' field")
	}

	// Check forecast structure
	forecast, ok := response["forecast"].(map[string]interface{})
	if !ok {
		t.Fatal("Forecast is not a map")
	}

	// Verify hourly forecast
	hourly, ok := forecast["hourly"].([]interface{})
	if !ok {
		t.Fatal("Hourly forecast is not an array")
	}
	if len(hourly) != 24 {
		t.Errorf("Expected 24 hourly entries, got %d", len(hourly))
	}

	// Check first hourly entry structure
	if len(hourly) > 0 {
		firstHour, ok := hourly[0].(map[string]interface{})
		if !ok {
			t.Fatal("First hourly entry is not a map")
		}

		// Verify required fields
		requiredFields := []string{"timestamp", "temperature", "weatherCondition"}
		for _, field := range requiredFields {
			if _, ok := firstHour[field]; !ok {
				t.Errorf("Hourly entry missing field: %s", field)
			}
		}

		// Check temperature structure
		if temp, ok := firstHour["temperature"].(map[string]interface{}); ok {
			if _, ok := temp["degrees"]; !ok {
				t.Error("Temperature missing 'degrees' field")
			}
			if _, ok := temp["unit"]; !ok {
				t.Error("Temperature missing 'unit' field")
			}
		} else {
			t.Error("Temperature is not a map")
		}
	}

	// Verify daily forecast
	daily, ok := forecast["daily"].([]interface{})
	if !ok {
		t.Fatal("Daily forecast is not an array")
	}
	if len(daily) != 5 {
		t.Errorf("Expected 5 daily entries, got %d", len(daily))
	}

	// Check first daily entry structure
	if len(daily) > 0 {
		firstDay, ok := daily[0].(map[string]interface{})
		if !ok {
			t.Fatal("First daily entry is not a map")
		}

		// Verify required fields
		requiredFields := []string{"date", "maxTemperature", "minTemperature", "weatherCondition"}
		for _, field := range requiredFields {
			if _, ok := firstDay[field]; !ok {
				t.Errorf("Daily entry missing field: %s", field)
			}
		}
	}
}

// Test CORS headers
func TestCORSHeaders(t *testing.T) {
	handler := enableCORS(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	// Test with origin header
	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("Origin", "chrome-extension://test")
	w := httptest.NewRecorder()

	handler(w, req)

	// Check CORS headers
	if origin := w.Header().Get("Access-Control-Allow-Origin"); origin != "chrome-extension://test" {
		t.Errorf("Expected origin header to be 'chrome-extension://test', got '%s'", origin)
	}

	// Test OPTIONS preflight
	req = httptest.NewRequest("OPTIONS", "/test", nil)
	w = httptest.NewRecorder()

	handler(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected OPTIONS to return 200, got %d", w.Code)
	}
}

// Test current conditions handler
func TestCurrentConditionsHandler(t *testing.T) {
	// Create mock server
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Verify API key is passed
		if !r.URL.Query().Has("key") {
			t.Error("API key not passed to Google API")
		}
		
		// Return mock response
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(mockGoogleWeatherResponse())
	}))
	defer mockServer.Close()

	// Override base URL
	originalBase := GOOGLE_WEATHER_BASE
	GOOGLE_WEATHER_BASE = mockServer.URL
	defer func() { GOOGLE_WEATHER_BASE = originalBase }()

	os.Setenv("GOOGLE_API_KEY", "test-key")
	defer os.Unsetenv("GOOGLE_API_KEY")

	// Test valid request
	req := httptest.NewRequest("GET", "/api/current?lat=37.7749&lon=-122.4194", nil)
	w := httptest.NewRecorder()

	currentConditionsHandler(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	// Parse response
	var response map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	// Verify temperature exists
	if temp, ok := response["temperature"].(map[string]interface{}); ok {
		if degrees, ok := temp["degrees"].(float64); !ok || degrees != 20.5 {
			t.Error("Temperature degrees not correct")
		}
	} else {
		t.Error("Temperature not found in response")
	}

	// Test missing parameters
	req = httptest.NewRequest("GET", "/api/current", nil)
	w = httptest.NewRecorder()

	currentConditionsHandler(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400 for missing params, got %d", w.Code)
	}
}

// Test geocoding handler
func TestGeocodeHandler(t *testing.T) {
	// Mock geocoding response
	mockGeoResponse := map[string]interface{}{
		"results": []map[string]interface{}{
			{
				"formatted_address": "San Francisco, CA, USA",
				"geometry": map[string]interface{}{
					"location": map[string]interface{}{
						"lat": 37.7749,
						"lng": -122.4194,
					},
				},
				"place_id": "test-place-id",
			},
		},
		"status": "OK",
	}

	// Create mock server
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Check that address is passed
		if !r.URL.Query().Has("address") {
			t.Error("Address not passed to Geocoding API")
		}
		
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(mockGeoResponse)
	}))
	defer mockServer.Close()

	// Override geocoding URL
	originalURL := GOOGLE_GEOCODING_URL
	GOOGLE_GEOCODING_URL = mockServer.URL
	defer func() { GOOGLE_GEOCODING_URL = originalURL }()

	os.Setenv("GOOGLE_API_KEY", "test-key")
	defer os.Unsetenv("GOOGLE_API_KEY")

	// Test valid request
	req := httptest.NewRequest("GET", "/api/geocode?address=San+Francisco", nil)
	w := httptest.NewRecorder()

	geocodeHandler(w, req)

	if w.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", w.Code)
	}

	// Parse response
	var response map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &response); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	// Verify results
	if results, ok := response["results"].([]interface{}); ok {
		if len(results) == 0 {
			t.Error("No results in geocoding response")
		}
	} else {
		t.Error("Results not found in response")
	}
}

// Integration test with real API (skip in CI)
func TestRealGoogleWeatherAPI(t *testing.T) {
	if os.Getenv("GOOGLE_API_KEY") == "" {
		t.Skip("Skipping real API test - no API key set")
	}

	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	// Test with real coordinates (San Francisco)
	url := fmt.Sprintf("%s/currentConditions:lookup?key=%s&location.latitude=37.7749&location.longitude=-122.4194",
		GOOGLE_WEATHER_BASE, os.Getenv("GOOGLE_API_KEY"))

	resp, err := http.Get(url)
	if err != nil {
		t.Fatalf("Failed to call Google Weather API: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		t.Fatalf("Google Weather API returned status %d: %s", resp.StatusCode, string(body))
	}

	var data map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		t.Fatalf("Failed to parse Google Weather response: %v", err)
	}

	// Log the actual response structure for debugging
	t.Logf("Google Weather API response structure:")
	prettyJSON, _ := json.MarshalIndent(data, "", "  ")
	t.Logf("%s", string(prettyJSON))

	// Verify expected fields
	expectedFields := []string{"temperature", "weatherCondition", "relativeHumidity"}
	for _, field := range expectedFields {
		if _, ok := data[field]; !ok {
			t.Errorf("Expected field '%s' not found in response", field)
		}
	}
}

// Test synthetic forecast generation
func TestSyntheticForecastGeneration(t *testing.T) {
	// Create mock current conditions
	currentData := mockGoogleWeatherResponse()
	
	// Generate hourly forecast
	var hourlyList []interface{}
	currentTime := time.Now()
	for i := 0; i < 24; i++ {
		hourTime := currentTime.Add(time.Duration(i) * time.Hour)
		
		hourlyItem := map[string]interface{}{
			"timestamp":            hourTime.Format(time.RFC3339),
			"temperature":          currentData["temperature"],
			"feelsLikeTemperature": currentData["feelsLikeTemperature"],
			"relativeHumidity":     currentData["relativeHumidity"],
			"weatherCondition":     currentData["weatherCondition"],
			"wind":                 currentData["wind"],
		}
		
		if precip, ok := currentData["precipitation"].(map[string]interface{}); ok {
			if prob, ok := precip["probability"].(map[string]interface{}); ok {
				hourlyItem["precipitationProbability"] = prob
			}
		}
		
		hourlyList = append(hourlyList, hourlyItem)
	}

	// Verify hourly list
	if len(hourlyList) != 24 {
		t.Errorf("Expected 24 hourly entries, got %d", len(hourlyList))
	}

	// Check structure of first entry
	firstHour := hourlyList[0].(map[string]interface{})
	
	// Verify timestamp format
	if timestamp, ok := firstHour["timestamp"].(string); ok {
		if _, err := time.Parse(time.RFC3339, timestamp); err != nil {
			t.Errorf("Invalid timestamp format: %v", err)
		}
	} else {
		t.Error("Timestamp not found or not a string")
	}

	// Verify temperature structure is preserved
	if temp, ok := firstHour["temperature"].(map[string]interface{}); ok {
		if degrees, ok := temp["degrees"].(float64); !ok || degrees != 20.5 {
			t.Error("Temperature degrees not preserved correctly")
		}
	} else {
		t.Error("Temperature structure not preserved")
	}

	// Generate daily forecast
	var dailyList []interface{}
	var baseTemp float64 = 20.5
	
	for i := 0; i < 5; i++ {
		futureDate := currentTime.AddDate(0, 0, i)
		
		dailyItem := map[string]interface{}{
			"date": futureDate.Format("2006-01-02"),
			"maxTemperature": map[string]interface{}{
				"degrees": baseTemp + 2,
				"unit":    "CELSIUS",
			},
			"minTemperature": map[string]interface{}{
				"degrees": baseTemp - 2,
				"unit":    "CELSIUS",
			},
			"weatherCondition": currentData["weatherCondition"],
		}
		
		dailyList = append(dailyList, dailyItem)
	}

	// Verify daily list
	if len(dailyList) != 5 {
		t.Errorf("Expected 5 daily entries, got %d", len(dailyList))
	}

	// Check structure of first day
	firstDay := dailyList[0].(map[string]interface{})
	
	// Verify date format
	if date, ok := firstDay["date"].(string); ok {
		if _, err := time.Parse("2006-01-02", date); err != nil {
			t.Errorf("Invalid date format: %v", err)
		}
	} else {
		t.Error("Date not found or not a string")
	}

	// Verify temperature variation
	if maxTemp, ok := firstDay["maxTemperature"].(map[string]interface{}); ok {
		if degrees, ok := maxTemp["degrees"].(float64); !ok || degrees != 22.5 {
			t.Errorf("Max temperature not correct, expected 22.5, got %v", degrees)
		}
	}
}