package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"time"
)

var (
	// These are variables so they can be overridden in tests
	GOOGLE_WEATHER_BASE = "https://weather.googleapis.com/v1"
	GOOGLE_GEOCODING_URL = "https://maps.googleapis.com/maps/api/geocode/json"
)

const (
	OPENWEATHER_FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast"
	OPENWEATHER_ONECALL_URL = "https://api.openweathermap.org/data/2.5/onecall"
	// OpenWeatherMap API key (free tier)
	OPENWEATHER_API_KEY = "439d4b804bc8187953eb36d2a8c26a02"
)

// Helper function to get condition description
func getConditionDescription(conditionType string) string {
	descriptions := map[string]string{
		"CLEAR": "Clear",
		"PARTLY_CLOUDY": "Partly Cloudy",
		"MOSTLY_CLOUDY": "Mostly Cloudy",
		"CLOUDY": "Cloudy",
		"LIGHT_RAIN": "Light Rain",
	}
	if desc, ok := descriptions[conditionType]; ok {
		return desc
	}
	return "Unknown"
}

// Helper function to extract timestamp from interval
func getTimeFromInterval(interval interface{}) string {
	if intervalMap, ok := interval.(map[string]interface{}); ok {
		if startTime, ok := intervalMap["startTime"].(string); ok {
			return startTime
		}
	}
	return time.Now().Format(time.RFC3339)
}

// Create synthetic hourly data as fallback
func createSyntheticHourlyData(currentData map[string]interface{}) []interface{} {
	var hourlyList []interface{}
	currentTime := time.Now()
	
	for i := 0; i < 24; i++ {
		hourTime := currentTime.Add(time.Duration(i) * time.Hour)
		hourlyItem := map[string]interface{}{
			"timestamp": hourTime.Format(time.RFC3339),
			"temperature": currentData["temperature"],
			"feelsLikeTemperature": currentData["feelsLikeTemperature"],
			"relativeHumidity": currentData["relativeHumidity"],
			"weatherCondition": currentData["weatherCondition"],
			"wind": currentData["wind"],
		}
		
		if precip, ok := currentData["precipitation"].(map[string]interface{}); ok {
			hourlyItem["precipitation"] = precip
		}
		
		hourlyList = append(hourlyList, hourlyItem)
	}
	
	return hourlyList
}

// Create synthetic daily data as fallback
func createSyntheticDailyData(currentData map[string]interface{}) []interface{} {
	var dailyList []interface{}
	currentTime := time.Now()
	
	var baseTemp float64 = 15.0
	if temp, ok := currentData["temperature"].(map[string]interface{}); ok {
		if deg, ok := temp["degrees"].(float64); ok {
			baseTemp = deg
		}
	}
	
	for i := 0; i < 5; i++ {
		futureDate := currentTime.AddDate(0, 0, i)
		dailyItem := map[string]interface{}{
			"date": futureDate.Format("2006-01-02"),
			"maxTemperature": map[string]interface{}{
				"degrees": baseTemp + 3,
				"unit": "CELSIUS",
			},
			"minTemperature": map[string]interface{}{
				"degrees": baseTemp - 3,
				"unit": "CELSIUS",
			},
			"weatherCondition": currentData["weatherCondition"],
		}
		
		if precip, ok := currentData["precipitation"].(map[string]interface{}); ok {
			dailyItem["precipitationProbability"] = precip["probability"]
		}
		
		dailyList = append(dailyList, dailyItem)
	}
	
	return dailyList
}

// CORS middleware
func enableCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Allow all origins for Chrome extension
		origin := r.Header.Get("Origin")
		if origin != "" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		} else {
			w.Header().Set("Access-Control-Allow-Origin", "*")
		}
		
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Extension-Token, X-Extension-ID, X-Extension-Version, X-Extension-Fingerprint, X-Request-ID")
		w.Header().Set("Access-Control-Max-Age", "86400")
		
		// Handle preflight requests
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		
		next(w, r)
	}
}

// Health check endpoint
func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "healthy",
		"service": "weather-api-proxy",
		"timestamp": time.Now().Format(time.RFC3339),
	})
}

// Current conditions endpoint
func currentConditionsHandler(w http.ResponseWriter, r *http.Request) {
	apiKey := os.Getenv("GOOGLE_API_KEY")
	if apiKey == "" {
		http.Error(w, "API key not configured", http.StatusInternalServerError)
		return
	}
	
	// Get query parameters
	lat := r.URL.Query().Get("lat")
	lon := r.URL.Query().Get("lon")
	
	if lat == "" || lon == "" {
		http.Error(w, "Missing latitude or longitude", http.StatusBadRequest)
		return
	}
	
	// Build Google Weather API URL
	url := fmt.Sprintf("%s/currentConditions:lookup?key=%s&location.latitude=%s&location.longitude=%s",
		GOOGLE_WEATHER_BASE, apiKey, lat, lon)
	
	// Make request to Google Weather API
	resp, err := http.Get(url)
	if err != nil {
		log.Printf("Error fetching current conditions: %v", err)
		http.Error(w, "Failed to fetch weather data", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()
	
	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Error reading response: %v", err)
		http.Error(w, "Failed to read weather data", http.StatusInternalServerError)
		return
	}
	
	// Return response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	w.Write(body)
}

// Hourly forecast endpoint
func hourlyForecastHandler(w http.ResponseWriter, r *http.Request) {
	apiKey := os.Getenv("GOOGLE_API_KEY")
	if apiKey == "" {
		http.Error(w, "API key not configured", http.StatusInternalServerError)
		return
	}
	
	// Get query parameters
	lat := r.URL.Query().Get("lat")
	lon := r.URL.Query().Get("lon")
	hours := r.URL.Query().Get("hours")
	
	if lat == "" || lon == "" {
		http.Error(w, "Missing latitude or longitude", http.StatusBadRequest)
		return
	}
	
	if hours == "" {
		hours = "24" // Default to 24 hours
	}
	
	// Build Google Weather API URL for hourly forecast
	url := fmt.Sprintf("%s/forecast/hours:lookup?key=%s&location.latitude=%s&location.longitude=%s&hours=%s",
		GOOGLE_WEATHER_BASE, apiKey, lat, lon, hours)
	
	// Make request to Google Weather API
	resp, err := http.Get(url)
	if err != nil {
		log.Printf("Error fetching hourly forecast: %v", err)
		http.Error(w, "Failed to fetch hourly forecast data", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()
	
	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Error reading response: %v", err)
		http.Error(w, "Failed to read hourly forecast data", http.StatusInternalServerError)
		return
	}
	
	// Return response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	w.Write(body)
}

// Hourly history endpoint - Google Weather API provides past 24 hours
func hourlyHistoryHandler(w http.ResponseWriter, r *http.Request) {
	apiKey := os.Getenv("GOOGLE_API_KEY")
	if apiKey == "" {
		http.Error(w, "API key not configured", http.StatusInternalServerError)
		return
	}
	
	// Get query parameters
	lat := r.URL.Query().Get("lat")
	lon := r.URL.Query().Get("lon")
	hours := r.URL.Query().Get("hours")
	
	if lat == "" || lon == "" {
		http.Error(w, "Missing latitude or longitude", http.StatusBadRequest)
		return
	}
	
	if hours == "" {
		hours = "24" // Default to 24 hours of history
	}
	
	// Build Google Weather API URL for hourly history
	url := fmt.Sprintf("%s/history/hours:lookup?key=%s&location.latitude=%s&location.longitude=%s&hours=%s",
		GOOGLE_WEATHER_BASE, apiKey, lat, lon, hours)
	
	// Make request to Google Weather API
	resp, err := http.Get(url)
	if err != nil {
		log.Printf("Error fetching hourly history: %v", err)
		http.Error(w, "Failed to fetch hourly history data", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()
	
	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Error reading response: %v", err)
		http.Error(w, "Failed to read hourly history data", http.StatusInternalServerError)
		return
	}
	
	// Return response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	w.Write(body)
}

// Daily forecast endpoint
func dailyForecastHandler(w http.ResponseWriter, r *http.Request) {
	apiKey := os.Getenv("GOOGLE_API_KEY")
	if apiKey == "" {
		http.Error(w, "API key not configured", http.StatusInternalServerError)
		return
	}
	
	// Get query parameters
	lat := r.URL.Query().Get("lat")
	lon := r.URL.Query().Get("lon")
	days := r.URL.Query().Get("days")
	
	if lat == "" || lon == "" {
		http.Error(w, "Missing latitude or longitude", http.StatusBadRequest)
		return
	}
	
	if days == "" {
		days = "14" // Default to 14 days
	}
	
	// Build Google Weather API URL for daily forecast
	url := fmt.Sprintf("%s/forecast/days:lookup?key=%s&location.latitude=%s&location.longitude=%s&days=%s",
		GOOGLE_WEATHER_BASE, apiKey, lat, lon, days)
	
	// Make request to Google Weather API
	resp, err := http.Get(url)
	if err != nil {
		log.Printf("Error fetching daily forecast: %v", err)
		http.Error(w, "Failed to fetch daily forecast data", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()
	
	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Error reading response: %v", err)
		http.Error(w, "Failed to read daily forecast data", http.StatusInternalServerError)
		return
	}
	
	// Return response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	w.Write(body)
}

// Geocoding endpoint
func geocodeHandler(w http.ResponseWriter, r *http.Request) {
	apiKey := os.Getenv("GOOGLE_API_KEY")
	if apiKey == "" {
		http.Error(w, "API key not configured", http.StatusInternalServerError)
		return
	}
	
	// Get query parameters
	address := r.URL.Query().Get("address")
	
	if address == "" {
		http.Error(w, "Missing address parameter", http.StatusBadRequest)
		return
	}
	
	// Build Google Geocoding API URL - address is already URL-decoded by r.URL.Query()
	// We need to re-encode it for the Google API
	apiUrl := fmt.Sprintf("%s?address=%s&key=%s", GOOGLE_GEOCODING_URL, url.QueryEscape(address), apiKey)
	
	// Make request to Google Geocoding API
	resp, err := http.Get(apiUrl)
	if err != nil {
		log.Printf("Error geocoding address: %v", err)
		http.Error(w, "Failed to geocode address", http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()
	
	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Error reading response: %v", err)
		http.Error(w, "Failed to read geocoding data", http.StatusInternalServerError)
		return
	}
	
	// Return response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	w.Write(body)
}

// Combined weather endpoint (all from Google Weather API)
func weatherHandler(w http.ResponseWriter, r *http.Request) {
	apiKey := os.Getenv("GOOGLE_API_KEY")
	if apiKey == "" {
		http.Error(w, "API key not configured", http.StatusInternalServerError)
		return
	}
	
	// Get query parameters
	lat := r.URL.Query().Get("lat")
	lon := r.URL.Query().Get("lon")
	
	if lat == "" || lon == "" {
		http.Error(w, "Missing latitude or longitude", http.StatusBadRequest)
		return
	}
	
	// Fetch current conditions from Google
	currentURL := fmt.Sprintf("%s/currentConditions:lookup?key=%s&location.latitude=%s&location.longitude=%s",
		GOOGLE_WEATHER_BASE, apiKey, lat, lon)
	
	currentResp, err := http.Get(currentURL)
	if err != nil {
		log.Printf("Error fetching current conditions: %v", err)
		http.Error(w, "Failed to fetch current weather", http.StatusInternalServerError)
		return
	}
	defer currentResp.Body.Close()
	
	var currentData map[string]interface{}
	if err := json.NewDecoder(currentResp.Body).Decode(&currentData); err != nil {
		log.Printf("Error decoding current weather: %v", err)
		http.Error(w, "Failed to parse current weather", http.StatusInternalServerError)
		return
	}
	
	// Check if client requested specific hours (default to 24)
	hours := r.URL.Query().Get("hours")
	if hours == "" {
		hours = "24"
	}
	
	// Fetch hourly forecast (next hours only - no history)
	forecastURL := fmt.Sprintf("%s/forecast/hours:lookup?key=%s&location.latitude=%s&location.longitude=%s&hours=%s",
		GOOGLE_WEATHER_BASE, apiKey, lat, lon, hours)
	
	forecastResp, err := http.Get(forecastURL)
	if err != nil {
		log.Printf("Error fetching hourly forecast: %v", err)
	}
	var forecastData map[string]interface{}
	if forecastResp != nil && forecastResp.StatusCode == http.StatusOK {
		defer forecastResp.Body.Close()
		json.NewDecoder(forecastResp.Body).Decode(&forecastData)
	}
	
	// Fetch daily forecast
	dailyURL := fmt.Sprintf("%s/forecast/days:lookup?key=%s&location.latitude=%s&location.longitude=%s&days=5",
		GOOGLE_WEATHER_BASE, apiKey, lat, lon)
	
	dailyResp, err := http.Get(dailyURL)
	if err != nil {
		log.Printf("Error fetching daily forecast: %v", err)
	}
	var dailyData map[string]interface{}
	if dailyResp != nil && dailyResp.StatusCode == http.StatusOK {
		defer dailyResp.Body.Close()
		json.NewDecoder(dailyResp.Body).Decode(&dailyData)
	}
	
	// Process hourly forecast data (future hours only)
	var hourlyList []interface{}
	var dailyList []interface{}
	if forecastData != nil {
		// Try both "hours" and "forecastHours" keys
		var forecastHours []interface{}
		if hours, ok := forecastData["hours"].([]interface{}); ok {
			forecastHours = hours
		} else if fHours, ok := forecastData["forecastHours"].([]interface{}); ok {
			forecastHours = fHours
		}
		
		if forecastHours != nil {
			for _, hour := range forecastHours {
				if hourData, ok := hour.(map[string]interface{}); ok {
					// Convert to our expected format
					hourlyItem := map[string]interface{}{
						"timestamp":                getTimeFromInterval(hourData["interval"]),
						"temperature":              hourData["temperature"],
						"feelsLikeTemperature":     hourData["feelsLikeTemperature"],
						"relativeHumidity":         hourData["relativeHumidity"],
						"weatherCondition":         hourData["weatherCondition"],
						"wind":                     hourData["wind"],
						"precipitationProbability": hourData["precipitationProbability"],
						"uvIndex":                  hourData["uvIndex"],
						"visibility":               hourData["visibility"],
						"cloudCover":               hourData["cloudCover"],
						"isDaytime":                hourData["isDaytime"],
						"airPressure":              hourData["airPressure"],
						"dewPoint":                 hourData["dewPoint"],
					}
					hourlyList = append(hourlyList, hourlyItem)
				}
			}
		}
	}
	
	// If we couldn't get hourly data, create synthetic fallback
	if len(hourlyList) == 0 {
		log.Printf("No hourly data available, using synthetic data")
		hourlyList = createSyntheticHourlyData(currentData)
	}
	
	// Process daily forecast data
	if dailyData != nil {
		// Try both "days" and "forecastDays" keys
		var forecastDays []interface{}
		if days, ok := dailyData["days"].([]interface{}); ok {
			forecastDays = days
		} else if fDays, ok := dailyData["forecastDays"].([]interface{}); ok {
			forecastDays = fDays
		}
		
		if forecastDays != nil {
			for _, day := range forecastDays {
				if dayData, ok := day.(map[string]interface{}); ok {
					// Extract date from displayDate or interval
					var date string
					if displayDate, ok := dayData["displayDate"].(map[string]interface{}); ok {
						year := int(displayDate["year"].(float64))
						month := int(displayDate["month"].(float64))
						day := int(displayDate["day"].(float64))
						date = fmt.Sprintf("%04d-%02d-%02d", year, month, day)
					} else if interval, ok := dayData["interval"].(map[string]interface{}); ok {
						if startTime, ok := interval["startTime"].(string); ok {
							date = startTime[:10] // Extract YYYY-MM-DD
						}
					}
					
					// Use daytime forecast as primary weather condition
					var weatherCond interface{}
					var uvIndex interface{}
					var precipitation interface{}
					var wind interface{}
					var humidity interface{}
					
					if daytime, ok := dayData["daytimeForecast"].(map[string]interface{}); ok {
						weatherCond = daytime["weatherCondition"]
						uvIndex = daytime["uvIndex"]
						precipitation = daytime["precipitation"]
						wind = daytime["wind"]
						humidity = daytime["relativeHumidity"]
					}
					
					dailyItem := map[string]interface{}{
						"date":                     date,
						"maxTemperature":           dayData["maxTemperature"],
						"minTemperature":           dayData["minTemperature"],
						"feelsLikeMaxTemperature":  dayData["feelsLikeMaxTemperature"],
						"feelsLikeMinTemperature":  dayData["feelsLikeMinTemperature"],
						"weatherCondition":         weatherCond,
						"precipitationProbability": precipitation,
						"wind":                     wind,
						"relativeHumidity":         humidity,
						"uvIndex":                  uvIndex,
						"sunEvents":                dayData["sunEvents"],
						"moonEvents":               dayData["moonEvents"],
						"daytimeForecast":          dayData["daytimeForecast"],
						"nighttimeForecast":        dayData["nighttimeForecast"],
					}
					dailyList = append(dailyList, dailyItem)
				}
			}
		}
	}
	
	// If we couldn't get daily data, create synthetic fallback
	if len(dailyList) == 0 {
		log.Printf("No daily data available, using synthetic data")
		dailyList = createSyntheticDailyData(currentData)
	}
	
	// Combine all responses
	response := map[string]interface{}{
		"current": currentData,
		"forecast": map[string]interface{}{
			"daily": dailyList,
			"hourly": hourlyList,
		},
		"timestamp": time.Now().Format(time.RFC3339),
	}
	
	// Return combined response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func main() {
	// Get port from environment or use default
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	
	// Start cleanup routine for inactive sessions
	cleanupInactiveSessions()
	
	// Setup routes with authentication
	http.HandleFunc("/", enableCORS(healthHandler))
	http.HandleFunc("/health", enableCORS(healthHandler))
	
	// Authentication endpoints
	http.HandleFunc("/api/auth/register", enableCORS(registerExtensionHandler))
	http.HandleFunc("/api/auth/validate", enableCORS(authMiddleware(validateTokenHandler)))
	http.HandleFunc("/api/auth/stats", enableCORS(authMiddleware(extensionStatsHandler)))
	
	// Protected weather endpoints
	http.HandleFunc("/api/current", enableCORS(authMiddleware(currentConditionsHandler)))
	http.HandleFunc("/api/history", enableCORS(authMiddleware(hourlyHistoryHandler)))
	http.HandleFunc("/api/forecast", enableCORS(authMiddleware(hourlyForecastHandler)))
	http.HandleFunc("/api/daily", enableCORS(authMiddleware(dailyForecastHandler)))
	http.HandleFunc("/api/geocode", enableCORS(authMiddleware(geocodeHandler)))
	http.HandleFunc("/api/weather", enableCORS(authMiddleware(weatherHandler)))
	
	// Start server
	log.Printf("Weather service with authentication starting on port %s", port)
	log.Printf("Security features enabled: token validation, rate limiting, session management")
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}