package manifest

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/benebsworth/chrome-home-extension/image-pipeline/pkg/optimizer"
	"github.com/benebsworth/chrome-home-extension/image-pipeline/pkg/uploader"
)

// Manifest represents the image manifest for the Chrome extension
type Manifest struct {
	Version   string  `json:"version"`
	Generated string  `json:"generated"`
	BaseURL   string  `json:"base_url"`
	Images    []Image `json:"images"`
}

// Image represents a single image with multiple variants
type Image struct {
	ID       string           `json:"id"`
	Name     string           `json:"name"`
	Variants []ImageVariant   `json:"variants"`
	Metadata ImageMetadata    `json:"metadata"`
}

// ImageVariant represents a specific size/format variant of an image
type ImageVariant struct {
	Size      string `json:"size"`       // "full", "preview", "thumbnail"
	Format    string `json:"format"`     // "jpg", "webp"
	URL       string `json:"url"`
	Width     int    `json:"width"`
	Height    int    `json:"height"`
	FileSize  int64  `json:"file_size"`
}

// ImageMetadata holds additional information about the image
type ImageMetadata struct {
	OriginalSize int64    `json:"original_size"`
	Tags         []string `json:"tags,omitempty"`
}

// Generator generates image manifests
type Generator struct {
	baseURL string
}

// New creates a new manifest generator
func New(baseURL string) *Generator {
	return &Generator{baseURL: baseURL}
}

// GenerateFromOptimization generates a manifest from optimization results
func (g *Generator) GenerateFromOptimization(results []optimizer.Result) *Manifest {
	// Group results by source image
	imageGroups := make(map[string][]optimizer.Result)
	for _, r := range results {
		baseName := g.extractBaseName(r.SourcePath)
		imageGroups[baseName] = append(imageGroups[baseName], r)
	}

	// Create manifest
	manifest := &Manifest{
		Version:   "1.0.0",
		Generated: "",
		BaseURL:   g.baseURL,
		Images:    make([]Image, 0, len(imageGroups)),
	}

	for baseName, group := range imageGroups {
		image := Image{
			ID:       baseName,
			Name:     g.humanizeName(baseName),
			Variants: make([]ImageVariant, 0, len(group)),
			Metadata: ImageMetadata{
				OriginalSize: group[0].OriginalSize,
			},
		}

		for _, r := range group {
			fileName := filepath.Base(r.OutputPath)
			variant := ImageVariant{
				Size:     r.SizeName,
				Format:   r.Format,
				URL:      fmt.Sprintf("%s/%s", g.baseURL, fileName),
				Width:    r.Width,
				Height:   r.Height,
				FileSize: r.OptimizedSize,
			}
			image.Variants = append(image.Variants, variant)
		}

		manifest.Images = append(manifest.Images, image)
	}

	return manifest
}

// GenerateFromUploads generates a manifest from upload results
func (g *Generator) GenerateFromUploads(results []uploader.UploadResult) *Manifest {
	// Group results by base name (without size/format suffix)
	imageGroups := make(map[string][]uploader.UploadResult)
	for _, r := range results {
		baseName := g.extractBaseNameFromPath(r.LocalPath)
		imageGroups[baseName] = append(imageGroups[baseName], r)
	}

	// Create manifest
	manifest := &Manifest{
		Version:   "1.0.0",
		Generated: "",
		BaseURL:   g.baseURL,
		Images:    make([]Image, 0, len(imageGroups)),
	}

	for baseName, group := range imageGroups {
		image := Image{
			ID:       baseName,
			Name:     g.humanizeName(baseName),
			Variants: make([]ImageVariant, 0, len(group)),
		}

		for _, r := range group {
			fileName := filepath.Base(r.LocalPath)
			size, format := g.parseSizeAndFormat(fileName)
			
			variant := ImageVariant{
				Size:     size,
				Format:   format,
				URL:      r.PublicURL,
				FileSize: r.Size,
			}
			image.Variants = append(image.Variants, variant)
		}

		manifest.Images = append(manifest.Images, image)
	}

	return manifest
}

// Save saves the manifest to a file
func (m *Manifest) Save(path string) error {
	// Create directory if it doesn't exist
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return fmt.Errorf("failed to create directory: %w", err)
	}

	// Marshal manifest to JSON
	data, err := json.MarshalIndent(m, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal manifest: %w", err)
	}

	// Write to file
	if err := os.WriteFile(path, data, 0644); err != nil {
		return fmt.Errorf("failed to write manifest: %w", err)
	}

	return nil
}

// Load loads a manifest from a file
func Load(path string) (*Manifest, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("failed to read manifest: %w", err)
	}

	var manifest Manifest
	if err := json.Unmarshal(data, &manifest); err != nil {
		return nil, fmt.Errorf("failed to unmarshal manifest: %w", err)
	}

	return &manifest, nil
}

// extractBaseName extracts the base name from a file path (without extension)
func (g *Generator) extractBaseName(path string) string {
	base := filepath.Base(path)
	ext := filepath.Ext(base)
	return strings.TrimSuffix(base, ext)
}

// extractBaseNameFromPath extracts the base name from an optimized file path
// e.g., "image_preview.jpg" -> "image"
func (g *Generator) extractBaseNameFromPath(path string) string {
	base := filepath.Base(path)
	// Remove extension
	base = strings.TrimSuffix(base, filepath.Ext(base))
	// Remove size suffix (e.g., "_preview", "_thumbnail", "_full")
	parts := strings.Split(base, "_")
	if len(parts) > 1 {
		// Remove last part which should be the size
		return strings.Join(parts[:len(parts)-1], "_")
	}
	return base
}

// parseSizeAndFormat parses the size and format from a filename
// e.g., "image_preview.jpg" -> ("preview", "jpg")
func (g *Generator) parseSizeAndFormat(filename string) (string, string) {
	base := strings.TrimSuffix(filename, filepath.Ext(filename))
	format := strings.TrimPrefix(filepath.Ext(filename), ".")
	
	parts := strings.Split(base, "_")
	size := "unknown"
	if len(parts) > 0 {
		size = parts[len(parts)-1]
	}
	
	return size, format
}

// humanizeName converts a filename to a human-readable name
// e.g., "54565613170_7e8bef5479_o" -> "JWST Image 54565613170"
func (g *Generator) humanizeName(filename string) string {
	// For JWST images, extract the ID
	parts := strings.Split(filename, "_")
	if len(parts) > 0 && isNumeric(parts[0]) {
		return fmt.Sprintf("JWST Image %s", parts[0])
	}
	
	// Default: capitalize and replace underscores with spaces
	return strings.ReplaceAll(filename, "_", " ")
}

// isNumeric checks if a string is numeric
func isNumeric(s string) bool {
	for _, c := range s {
		if c < '0' || c > '9' {
			return false
		}
	}
	return len(s) > 0
}

// PrintManifestSummary prints a summary of the manifest
func PrintManifestSummary(m *Manifest) {
	fmt.Println("\n=== Manifest Summary ===")
	fmt.Printf("Version: %s\n", m.Version)
	fmt.Printf("Base URL: %s\n", m.BaseURL)
	fmt.Printf("Total images: %d\n", len(m.Images))
	
	if len(m.Images) > 0 {
		totalVariants := 0
		for _, img := range m.Images {
			totalVariants += len(img.Variants)
		}
		fmt.Printf("Total variants: %d\n", totalVariants)
		fmt.Printf("Average variants per image: %.1f\n", float64(totalVariants)/float64(len(m.Images)))
	}
	fmt.Println("========================")
}

