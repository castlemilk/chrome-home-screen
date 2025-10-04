#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const JWST_DIR = path.join(__dirname, 'images', 'jwst');
const OPTIMIZED_DIR = path.join(__dirname, 'images', 'jwst-optimized');

// Create optimized directory
if (!fs.existsSync(OPTIMIZED_DIR)) {
    fs.mkdirSync(OPTIMIZED_DIR, { recursive: true });
}

// Target size: 1920x1080 max dimension, JPEG quality 85
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1080;
const QUALITY = 85;

function optimizeImage(filename) {
    return new Promise((resolve, reject) => {
        const inputPath = path.join(JWST_DIR, filename);
        const outputPath = path.join(OPTIMIZED_DIR, filename.replace(/\.(png|jpg|jpeg)$/i, '.jpg'));
        
        // Using sips (built into macOS) to resize and convert
        const command = `sips -s format jpeg -s formatOptions ${QUALITY} -Z ${Math.max(MAX_WIDTH, MAX_HEIGHT)} "${inputPath}" --out "${outputPath}"`;
        
        console.log(`Optimizing ${filename}...`);
        
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error optimizing ${filename}:`, error);
                reject(error);
                return;
            }
            
            // Get file sizes for comparison
            const originalSize = fs.statSync(inputPath).size;
            const optimizedSize = fs.statSync(outputPath).size;
            const reduction = ((1 - optimizedSize / originalSize) * 100).toFixed(1);
            
            console.log(`✓ ${filename} - Reduced by ${reduction}% (${(originalSize / 1024 / 1024).toFixed(1)}MB → ${(optimizedSize / 1024 / 1024).toFixed(1)}MB)`);
            resolve();
        });
    });
}

async function optimizeAllImages() {
    console.log('Starting image optimization...\n');
    
    const files = fs.readdirSync(JWST_DIR).filter(f => /\.(png|jpg|jpeg)$/i.test(f));
    
    for (const file of files) {
        try {
            await optimizeImage(file);
        } catch (error) {
            console.error(`Failed to optimize ${file}`);
        }
    }
    
    console.log('\nOptimization complete!');
    console.log(`\nTo use optimized images, update jwst-images.js to use paths from 'images/jwst-optimized/'`);
}

// Run optimization
optimizeAllImages();