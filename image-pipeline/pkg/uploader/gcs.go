package uploader

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"cloud.google.com/go/storage"
	"github.com/benebsworth/chrome-home-extension/image-pipeline/config"
	"google.golang.org/api/iterator"
	"google.golang.org/api/option"
)

// UploadResult holds the result of an upload operation
type UploadResult struct {
	LocalPath  string
	RemotePath string
	PublicURL  string
	Size       int64
}

// Uploader handles GCS uploads
type Uploader struct {
	cfg    *config.Config
	client *storage.Client
	bucket *storage.BucketHandle
}

// New creates a new GCS Uploader
func New(ctx context.Context, cfg *config.Config) (*Uploader, error) {
	var client *storage.Client
	var err error

	// Create GCS client
	if cfg.GCS.CredentialsPath != "" {
		client, err = storage.NewClient(ctx, option.WithCredentialsFile(cfg.GCS.CredentialsPath))
	} else {
		// Use default credentials (e.g., from GOOGLE_APPLICATION_CREDENTIALS env var)
		client, err = storage.NewClient(ctx)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to create GCS client: %w", err)
	}

	bucket := client.Bucket(cfg.GCS.BucketName)

	return &Uploader{
		cfg:    cfg,
		client: client,
		bucket: bucket,
	}, nil
}

// Close closes the uploader and releases resources
func (u *Uploader) Close() error {
	return u.client.Close()
}

// UploadDirectory uploads all files from a directory to GCS
func (u *Uploader) UploadDirectory(ctx context.Context, localDir, remotePrefix string) ([]UploadResult, error) {
	var results []UploadResult

	// Walk through the directory
	err := filepath.Walk(localDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if info.IsDir() {
			return nil
		}

		// Calculate relative path
		relPath, err := filepath.Rel(localDir, path)
		if err != nil {
			return fmt.Errorf("failed to get relative path: %w", err)
		}

		// Create remote path
		remotePath := filepath.Join(remotePrefix, relPath)
		remotePath = filepath.ToSlash(remotePath) // Convert to forward slashes for GCS

		// Upload file
		result, err := u.UploadFile(ctx, path, remotePath)
		if err != nil {
			return fmt.Errorf("failed to upload %s: %w", path, err)
		}

		results = append(results, result)
		return nil
	})

	return results, err
}

// UploadFile uploads a single file to GCS
func (u *Uploader) UploadFile(ctx context.Context, localPath, remotePath string) (UploadResult, error) {
	// Open local file
	file, err := os.Open(localPath)
	if err != nil {
		return UploadResult{}, fmt.Errorf("failed to open file: %w", err)
	}
	defer file.Close()

	// Get file info
	fileInfo, err := file.Stat()
	if err != nil {
		return UploadResult{}, fmt.Errorf("failed to stat file: %w", err)
	}

	// Create GCS object
	obj := u.bucket.Object(remotePath)
	writer := obj.NewWriter(ctx)

	// Set content type based on file extension
	writer.ContentType = getContentType(localPath)

	// Set cache control for images (1 year)
	writer.CacheControl = "public, max-age=31536000"

	// Set metadata
	writer.Metadata = map[string]string{
		"uploaded-at": time.Now().Format(time.RFC3339),
		"source":      filepath.Base(localPath),
	}

	// Copy file to GCS
	if _, err := io.Copy(writer, file); err != nil {
		writer.Close()
		return UploadResult{}, fmt.Errorf("failed to copy file: %w", err)
	}

	if err := writer.Close(); err != nil {
		return UploadResult{}, fmt.Errorf("failed to close writer: %w", err)
	}

	// Note: Public read ACL is set at bucket level with uniform access
	// If uniform bucket-level access is enabled, object ACLs cannot be set
	// The bucket itself should have allUsers:objectViewer role set

	// Generate public URL
	publicURL := fmt.Sprintf("%s/%s", u.cfg.GCS.BaseURL, remotePath)

	return UploadResult{
		LocalPath:  localPath,
		RemotePath: remotePath,
		PublicURL:  publicURL,
		Size:       fileInfo.Size(),
	}, nil
}

// DeleteObject deletes an object from GCS
func (u *Uploader) DeleteObject(ctx context.Context, remotePath string) error {
	obj := u.bucket.Object(remotePath)
	if err := obj.Delete(ctx); err != nil {
		return fmt.Errorf("failed to delete object: %w", err)
	}
	return nil
}

// ListObjects lists all objects with a given prefix
func (u *Uploader) ListObjects(ctx context.Context, prefix string) ([]string, error) {
	var objects []string

	query := &storage.Query{Prefix: prefix}
	it := u.bucket.Objects(ctx, query)

	for {
		attrs, err := it.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("failed to iterate objects: %w", err)
		}
		objects = append(objects, attrs.Name)
	}

	return objects, nil
}

// getContentType returns the content type based on file extension
func getContentType(filename string) string {
	ext := strings.ToLower(filepath.Ext(filename))
	switch ext {
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".webp":
		return "image/webp"
	case ".json":
		return "application/json"
	default:
		return "application/octet-stream"
	}
}

// PrintUploadSummary prints a summary of upload results
func PrintUploadSummary(results []UploadResult) {
	if len(results) == 0 {
		fmt.Println("No files uploaded")
		return
	}

	var totalSize int64
	for _, r := range results {
		totalSize += r.Size
	}

	fmt.Println("\n=== Upload Summary ===")
	fmt.Printf("Files uploaded: %d\n", len(results))
	fmt.Printf("Total size: %.2f MB\n", float64(totalSize)/(1024*1024))
	fmt.Println("\nSample URLs:")
	for i, r := range results {
		if i >= 3 {
			fmt.Printf("... and %d more\n", len(results)-3)
			break
		}
		fmt.Printf("  %s\n", r.PublicURL)
	}
	fmt.Println("======================")
}

