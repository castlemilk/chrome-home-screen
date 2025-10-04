package config

import (
	"encoding/json"
	"fmt"
	"os"
)

// Config holds the application configuration
type Config struct {
	GCS GCSConfig `json:"gcs"`
	Images ImagesConfig `json:"images"`
	Output OutputConfig `json:"output"`
}

// GCSConfig holds Google Cloud Storage configuration
type GCSConfig struct {
	BucketName      string `json:"bucket_name"`
	ProjectID       string `json:"project_id"`
	CredentialsPath string `json:"credentials_path"`
	BaseURL         string `json:"base_url"` // e.g., https://storage.googleapis.com/bucket-name
	PublicRead      bool   `json:"public_read"`
}

// ImagesConfig holds image processing configuration
type ImagesConfig struct {
	SourceDir   string        `json:"source_dir"`
	Formats     []string      `json:"formats"` // e.g., ["jpg", "webp"]
	Quality     int           `json:"quality"` // 1-100
	Sizes       []ImageSize   `json:"sizes"`
}

// ImageSize defines an image size preset
type ImageSize struct {
	Name      string `json:"name"`       // e.g., "full", "preview", "thumbnail"
	MaxWidth  int    `json:"max_width"`  // 0 means no limit
	MaxHeight int    `json:"max_height"` // 0 means no limit
	Quality   int    `json:"quality"`    // Override global quality if > 0
}

// OutputConfig holds output configuration
type OutputConfig struct {
	LocalDir     string `json:"local_dir"`
	ManifestPath string `json:"manifest_path"`
}

// Load loads configuration from a JSON file
func Load(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read config file: %w", err)
	}

	var cfg Config
	if err := json.Unmarshal(data, &cfg); err != nil {
		return nil, fmt.Errorf("failed to parse config file: %w", err)
	}

	// Set defaults
	if cfg.Images.Quality == 0 {
		cfg.Images.Quality = 85
	}

	if len(cfg.Images.Formats) == 0 {
		cfg.Images.Formats = []string{"jpg", "webp"}
	}

	if len(cfg.Images.Sizes) == 0 {
		cfg.Images.Sizes = []ImageSize{
			{Name: "full", MaxWidth: 2560, MaxHeight: 1440, Quality: 90},
			{Name: "preview", MaxWidth: 1280, MaxHeight: 720, Quality: 85},
			{Name: "thumbnail", MaxWidth: 320, MaxHeight: 180, Quality: 80},
		}
	}

	return &cfg, nil
}

// GenerateDefault generates a default configuration file
func GenerateDefault(path string) error {
	cfg := &Config{
		GCS: GCSConfig{
			BucketName:      "chrome-home-images",
			ProjectID:       "your-project-id",
			CredentialsPath: "./gcs-credentials.json",
			BaseURL:         "https://storage.googleapis.com/chrome-home-images",
			PublicRead:      true,
		},
		Images: ImagesConfig{
			SourceDir: "./images/jwst",
			Formats:   []string{"jpg", "webp"},
			Quality:   85,
			Sizes: []ImageSize{
				{Name: "full", MaxWidth: 2560, MaxHeight: 1440, Quality: 90},
				{Name: "preview", MaxWidth: 1280, MaxHeight: 720, Quality: 85},
				{Name: "thumbnail", MaxWidth: 320, MaxHeight: 180, Quality: 80},
			},
		},
		Output: OutputConfig{
			LocalDir:     "./output",
			ManifestPath: "./output/manifest.json",
		},
	}

	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal config: %w", err)
	}

	if err := os.WriteFile(path, data, 0644); err != nil {
		return fmt.Errorf("failed to write config file: %w", err)
	}

	return nil
}

