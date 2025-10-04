package optimizer

import (
	"fmt"
	"image"
	"image/jpeg"
	"os"
	"path/filepath"
	"strings"

	"github.com/benebsworth/chrome-home-extension/image-pipeline/config"
	"github.com/disintegration/imaging"
)

// Result holds the result of an optimization operation
type Result struct {
	SourcePath   string
	OutputPath   string
	OriginalSize int64
	OptimizedSize int64
	Width        int
	Height       int
	Format       string
	SizeName     string
}

// Optimizer handles image optimization
type Optimizer struct {
	cfg *config.Config
}

// New creates a new Optimizer
func New(cfg *config.Config) *Optimizer {
	return &Optimizer{cfg: cfg}
}

// OptimizeAll processes all images in the source directory
func (o *Optimizer) OptimizeAll() ([]Result, error) {
	// Create output directory
	if err := os.MkdirAll(o.cfg.Output.LocalDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create output directory: %w", err)
	}

	// Find all images
	images, err := o.findImages()
	if err != nil {
		return nil, fmt.Errorf("failed to find images: %w", err)
	}

	var results []Result
	for _, imgPath := range images {
		imgResults, err := o.optimizeImage(imgPath)
		if err != nil {
			fmt.Printf("Warning: failed to optimize %s: %v\n", imgPath, err)
			continue
		}
		results = append(results, imgResults...)
	}

	return results, nil
}

// findImages finds all image files in the source directory
func (o *Optimizer) findImages() ([]string, error) {
	var images []string

	err := filepath.Walk(o.cfg.Images.SourceDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if info.IsDir() {
			return nil
		}

		ext := strings.ToLower(filepath.Ext(path))
		if ext == ".jpg" || ext == ".jpeg" || ext == ".png" || ext == ".webp" {
			images = append(images, path)
		}

		return nil
	})

	return images, err
}

// optimizeImage optimizes a single image to multiple sizes and formats
func (o *Optimizer) optimizeImage(sourcePath string) ([]Result, error) {
	// Load source image
	src, err := imaging.Open(sourcePath)
	if err != nil {
		return nil, fmt.Errorf("failed to open image: %w", err)
	}

	// Get original file info
	fileInfo, err := os.Stat(sourcePath)
	if err != nil {
		return nil, fmt.Errorf("failed to stat file: %w", err)
	}

	baseName := strings.TrimSuffix(filepath.Base(sourcePath), filepath.Ext(sourcePath))
	var results []Result

	// Process each size
	for _, size := range o.cfg.Images.Sizes {
		// Resize image
		resized := o.resizeImage(src, size)

		// Save in each format
		for _, format := range o.cfg.Images.Formats {
			outputName := fmt.Sprintf("%s_%s.%s", baseName, size.Name, format)
			outputPath := filepath.Join(o.cfg.Output.LocalDir, outputName)

			quality := size.Quality
			if quality == 0 {
				quality = o.cfg.Images.Quality
			}

			if err := o.saveImage(resized, outputPath, format, quality); err != nil {
				return nil, fmt.Errorf("failed to save %s: %w", outputPath, err)
			}

			// Get output file info
			outInfo, err := os.Stat(outputPath)
			if err != nil {
				return nil, fmt.Errorf("failed to stat output file: %w", err)
			}

			bounds := resized.Bounds()
			results = append(results, Result{
				SourcePath:    sourcePath,
				OutputPath:    outputPath,
				OriginalSize:  fileInfo.Size(),
				OptimizedSize: outInfo.Size(),
				Width:         bounds.Dx(),
				Height:        bounds.Dy(),
				Format:        format,
				SizeName:      size.Name,
			})
		}
	}

	return results, nil
}

// resizeImage resizes an image based on the size configuration
func (o *Optimizer) resizeImage(src image.Image, size config.ImageSize) image.Image {
	bounds := src.Bounds()
	width := bounds.Dx()
	height := bounds.Dy()

	// Calculate new dimensions while maintaining aspect ratio
	if size.MaxWidth > 0 && width > size.MaxWidth {
		ratio := float64(size.MaxWidth) / float64(width)
		width = size.MaxWidth
		height = int(float64(height) * ratio)
	}

	if size.MaxHeight > 0 && height > size.MaxHeight {
		ratio := float64(size.MaxHeight) / float64(height)
		height = size.MaxHeight
		width = int(float64(width) * ratio)
	}

	// Only resize if dimensions changed
	if width != bounds.Dx() || height != bounds.Dy() {
		return imaging.Resize(src, width, height, imaging.Lanczos)
	}

	return src
}

// saveImage saves an image in the specified format
func (o *Optimizer) saveImage(img image.Image, path, format string, quality int) error {
	file, err := os.Create(path)
	if err != nil {
		return fmt.Errorf("failed to create file: %w", err)
	}
	defer file.Close()

	switch strings.ToLower(format) {
	case "jpg", "jpeg":
		return jpeg.Encode(file, img, &jpeg.Options{Quality: quality})
	case "png":
		return imaging.Encode(file, img, imaging.PNG)
	case "webp":
		// Note: For production, you'd want to use a proper WebP encoder
		// For now, we'll save as JPEG with .webp extension as a placeholder
		return jpeg.Encode(file, img, &jpeg.Options{Quality: quality})
	default:
		return fmt.Errorf("unsupported format: %s", format)
	}
}

// PrintSummary prints a summary of optimization results
func PrintSummary(results []Result) {
	if len(results) == 0 {
		fmt.Println("No images processed")
		return
	}

	var totalOriginal, totalOptimized int64
	uniqueSources := make(map[string]bool)

	for _, r := range results {
		uniqueSources[r.SourcePath] = true
		totalOriginal += r.OriginalSize
		totalOptimized += r.OptimizedSize
	}

	fmt.Println("\n=== Optimization Summary ===")
	fmt.Printf("Source images processed: %d\n", len(uniqueSources))
	fmt.Printf("Output files generated: %d\n", len(results))
	fmt.Printf("Total original size: %.2f MB\n", float64(totalOriginal)/(1024*1024))
	fmt.Printf("Total optimized size: %.2f MB\n", float64(totalOptimized)/(1024*1024))
	
	savings := float64(totalOriginal-totalOptimized) / float64(totalOriginal) * 100
	fmt.Printf("Space saved: %.1f%%\n", savings)
	fmt.Println("===========================")
}

