package main

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/benebsworth/chrome-home-extension/image-pipeline/config"
	"github.com/benebsworth/chrome-home-extension/image-pipeline/pkg/manifest"
	"github.com/benebsworth/chrome-home-extension/image-pipeline/pkg/optimizer"
	"github.com/benebsworth/chrome-home-extension/image-pipeline/pkg/uploader"
	"github.com/spf13/cobra"
)

var (
	cfgFile string
	cfg     *config.Config
)

func main() {
	rootCmd := &cobra.Command{
		Use:   "image-pipeline",
		Short: "Image optimization and GCS upload pipeline for Chrome Home Extension",
		Long:  `A tool to optimize images to multiple sizes/formats and upload them to Google Cloud Storage.`,
	}

	rootCmd.PersistentFlags().StringVarP(&cfgFile, "config", "c", "config.json", "config file path")

	rootCmd.AddCommand(initCmd())
	rootCmd.AddCommand(optimizeCmd())
	rootCmd.AddCommand(uploadCmd())
	rootCmd.AddCommand(deployCmd())
	rootCmd.AddCommand(manifestCmd())

	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func initCmd() *cobra.Command{
	return &cobra.Command{
		Use:   "init",
		Short: "Initialize configuration file",
		RunE: func(cmd *cobra.Command, args []string) error {
			if _, err := os.Stat(cfgFile); err == nil {
				return fmt.Errorf("config file already exists: %s", cfgFile)
			}

			if err := config.GenerateDefault(cfgFile); err != nil {
				return fmt.Errorf("failed to generate config: %w", err)
			}

			fmt.Printf("✅ Created config file: %s\n", cfgFile)
			fmt.Println("📝 Please edit the file and update:")
			fmt.Println("   - GCS bucket name")
			fmt.Println("   - GCS project ID")
			fmt.Println("   - GCS credentials path")
			fmt.Println("   - Source image directory")
			return nil
		},
	}
}

func optimizeCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "optimize",
		Short: "Optimize images to multiple sizes and formats",
		RunE: func(cmd *cobra.Command, args []string) error {
			if err := loadConfig(); err != nil {
				return err
			}

			fmt.Println("🖼️  Starting image optimization...")
			start := time.Now()

			opt := optimizer.New(cfg)
			results, err := opt.OptimizeAll()
			if err != nil {
				return fmt.Errorf("optimization failed: %w", err)
			}

			optimizer.PrintSummary(results)
			fmt.Printf("⏱️  Completed in %v\n", time.Since(start).Round(time.Millisecond))

			return nil
		},
	}
}

func uploadCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "upload",
		Short: "Upload optimized images to GCS",
		RunE: func(cmd *cobra.Command, args []string) error {
			if err := loadConfig(); err != nil {
				return err
			}

			fmt.Println("☁️  Starting GCS upload...")
			start := time.Now()

			ctx := context.Background()
			up, err := uploader.New(ctx, cfg)
			if err != nil {
				return fmt.Errorf("failed to create uploader: %w", err)
			}
			defer up.Close()

			results, err := up.UploadDirectory(ctx, cfg.Output.LocalDir, "images")
			if err != nil {
				return fmt.Errorf("upload failed: %w", err)
			}

			uploader.PrintUploadSummary(results)
			fmt.Printf("⏱️  Completed in %v\n", time.Since(start).Round(time.Millisecond))

			return nil
		},
	}
}

func deployCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "deploy",
		Short: "Optimize, upload, and generate manifest (full pipeline)",
		RunE: func(cmd *cobra.Command, args []string) error {
			if err := loadConfig(); err != nil {
				return err
			}

			fmt.Println("🚀 Starting full deployment pipeline...")
			totalStart := time.Now()

			// Step 1: Optimize images
			fmt.Println("\n📦 Step 1/3: Optimizing images...")
			opt := optimizer.New(cfg)
			optResults, err := opt.OptimizeAll()
			if err != nil {
				return fmt.Errorf("optimization failed: %w", err)
			}
			optimizer.PrintSummary(optResults)

			// Step 2: Upload to GCS
			fmt.Println("\n☁️  Step 2/3: Uploading to GCS...")
			ctx := context.Background()
			up, err := uploader.New(ctx, cfg)
			if err != nil {
				return fmt.Errorf("failed to create uploader: %w", err)
			}
			defer up.Close()

			uploadResults, err := up.UploadDirectory(ctx, cfg.Output.LocalDir, "images")
			if err != nil {
				return fmt.Errorf("upload failed: %w", err)
			}
			uploader.PrintUploadSummary(uploadResults)

			// Step 3: Generate manifest
			fmt.Println("\n📋 Step 3/3: Generating manifest...")
			gen := manifest.New(cfg.GCS.BaseURL + "/images")
			m := gen.GenerateFromUploads(uploadResults)
			m.Generated = time.Now().Format(time.RFC3339)

			if err := m.Save(cfg.Output.ManifestPath); err != nil {
				return fmt.Errorf("failed to save manifest: %w", err)
			}

			// Upload manifest to GCS
			manifestResult, err := up.UploadFile(ctx, cfg.Output.ManifestPath, "manifest.json")
			if err != nil {
				return fmt.Errorf("failed to upload manifest: %w", err)
			}

			manifest.PrintManifestSummary(m)
			fmt.Printf("\n📄 Manifest URL: %s\n", manifestResult.PublicURL)
			fmt.Printf("✅ Pipeline completed in %v\n", time.Since(totalStart).Round(time.Second))

			return nil
		},
	}
}

func manifestCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "manifest",
		Short: "Generate manifest from local optimized images",
		RunE: func(cmd *cobra.Command, args []string) error {
			if err := loadConfig(); err != nil {
				return err
			}

			fmt.Println("📋 Generating manifest...")

			// For simplicity, we'll scan the output directory
			// In a real scenario, you'd use the optimization results
			fmt.Println("⚠️  Note: This generates a basic manifest from files.")
			fmt.Println("   For accurate metadata, use 'deploy' command instead.")

			return fmt.Errorf("not implemented - use 'deploy' command for full manifest generation")
		},
	}
}

func loadConfig() error {
	var err error
	cfg, err = config.Load(cfgFile)
	if err != nil {
		return fmt.Errorf("failed to load config: %w\nRun 'image-pipeline init' to create a config file", err)
	}
	return nil
}

