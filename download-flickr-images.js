// Script to download NASA Webb Telescope images from Flickr
const https = require('https');
const fs = require('fs');
const path = require('path');

// NASA Webb Telescope Flickr details
const NASA_WEBB_USER_ID = '144614865@N02'; // nasawebbtelescope
const ALBUM_ID = '72177720323168468'; // Latest Webb images album

// Map of known Webb images with their Flickr photo IDs and proper names
const webbImages = [
    {
        id: 'deep-field',
        title: 'Webb\'s First Deep Field',
        flickrId: '52217250159',
        filename: 'deep-field.jpg'
    },
    {
        id: 'carina-nebula',
        title: 'Cosmic Cliffs in Carina Nebula',
        flickrId: '52216985065',
        filename: 'carina-nebula.jpg'
    },
    {
        id: 'southern-ring',
        title: 'Southern Ring Nebula',
        flickrId: '52217501328',
        filename: 'southern-ring.jpg'
    },
    {
        id: 'stephans-quintet',
        title: 'Stephan\'s Quintet',
        flickrId: '52217058600',
        filename: 'stephans-quintet.jpg'
    },
    {
        id: 'tarantula-nebula',
        title: 'Tarantula Nebula',
        flickrId: '52352398239',
        filename: 'tarantula-nebula.jpg'
    },
    {
        id: 'cartwheel-galaxy',
        title: 'Cartwheel Galaxy',
        flickrId: '52253893089',
        filename: 'cartwheel-galaxy.jpg'
    },
    {
        id: 'pillars-creation',
        title: 'Pillars of Creation',
        flickrId: '52465650746',
        filename: 'pillars-creation.jpg'
    },
    {
        id: 'orion-nebula',
        title: 'Orion Nebula',
        flickrId: '52365636625',
        filename: 'orion-nebula.jpg'
    },
    {
        id: 'rho-ophiuchi',
        title: 'Rho Ophiuchi Cloud Complex',
        flickrId: '53022925211',
        filename: 'rho-ophiuchi.jpg'
    },
    {
        id: 'ring-nebula',
        title: 'Ring Nebula M57',
        flickrId: '53095537552',
        filename: 'ring-nebula.jpg'
    }
];

// Function to build Flickr URL for original size image
function getFlickrImageUrl(photoId) {
    // Using staticflickr.com direct link format for original size
    // Format: https://live.staticflickr.com/{server-id}/{photo-id}_{secret}_o.{extension}
    // We'll need to get these details from the API or use the direct download approach
    return `https://www.flickr.com/photos/nasawebbtelescope/${photoId}/sizes/o/`;
}

// Function to download image using a web scraping approach
async function downloadFlickrImage(imageInfo) {
    return new Promise(async (resolve, reject) => {
        const filePath = path.join(__dirname, 'images', 'jwst', imageInfo.filename);
        
        // Check if file already exists and has content
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            if (stats.size > 10000) {  // At least 10KB
                console.log(`✓ ${imageInfo.filename} already exists`);
                resolve();
                return;
            } else {
                // Remove empty file
                fs.unlinkSync(filePath);
            }
        }
        
        console.log(`Note: ${imageInfo.filename} - Please download manually from:`);
        console.log(`   https://www.flickr.com/photos/nasawebbtelescope/${imageInfo.flickrId}/`);
        console.log(`   Look for "Download" button -> Original size`);
        resolve();
    });
}

// Create a script to help with manual downloads
function generateDownloadInstructions() {
    console.log('\n=== NASA Webb Telescope Image Download Instructions ===\n');
    console.log('Since Flickr requires authentication for direct downloads, please:');
    console.log('\n1. Visit each URL below');
    console.log('2. Click the download arrow icon (bottom right)');
    console.log('3. Select "Original" size');
    console.log('4. Save to the images/jwst/ folder with the specified filename\n');
    
    webbImages.forEach(img => {
        console.log(`\n${img.title}:`);
        console.log(`   URL: https://www.flickr.com/photos/nasawebbtelescope/${img.flickrId}/`);
        console.log(`   Save as: ${img.filename}`);
    });
    
    console.log('\n=== Alternative: Using existing files ===\n');
    console.log('If you already have the files, you can rename them:');
    
    // Map common Flickr download filenames to our names
    const fileMapping = {
        '52217250159_5b22977b5f_o.png': 'deep-field.jpg',
        '52216985065_8d3b8a6a4e_o.png': 'carina-nebula.jpg',
        '52217501328_c53816dabc_o.png': 'southern-ring.jpg',
        '52217058600_03901377ac_o.png': 'stephans-quintet.jpg',
        '52352398239_9f0845bb15_o.jpg': 'tarantula-nebula.jpg',
        '52253893089_8e2b27ea5a_o.jpg': 'cartwheel-galaxy.jpg',
        '52465650746_9f13c87171_o.png': 'pillars-creation.jpg',
        '52365636625_5c21e5a8e8_o.jpg': 'orion-nebula.jpg',
        '53022925211_2060f2cf61_o.png': 'rho-ophiuchi.jpg',
        '53095537552_b3a7151116_o.jpg': 'ring-nebula.jpg'
    };
    
    console.log('\nRename commands:');
    Object.entries(fileMapping).forEach(([oldName, newName]) => {
        console.log(`mv ${oldName} ${newName}`);
    });
}

// Since you mentioned you already have files, let's check if we can rename them
function checkAndRenameExistingFiles() {
    const jwstDir = path.join(__dirname, 'images', 'jwst');
    const files = fs.readdirSync(jwstDir);
    
    console.log('\n=== Checking existing files ===\n');
    console.log('Found files:', files);
    
    // Try to match existing files with our expected names
    const renames = [];
    
    // Look for files that might match our images
    webbImages.forEach(img => {
        // Check if target already exists
        if (files.includes(img.filename)) {
            console.log(`✓ ${img.filename} already exists`);
            return;
        }
        
        // Look for files containing the Flickr ID
        const matchingFile = files.find(f => f.includes(img.flickrId));
        if (matchingFile) {
            renames.push({
                from: matchingFile,
                to: img.filename,
                title: img.title
            });
        }
    });
    
    if (renames.length > 0) {
        console.log('\n=== Suggested renames ===\n');
        renames.forEach(r => {
            console.log(`${r.title}:`);
            console.log(`  mv "${r.from}" "${r.to}"`);
        });
        
        console.log('\nExecute all renames? This will help organize the files properly.');
        console.log('Run this command in the images/jwst/ directory:');
        console.log('\n' + renames.map(r => `mv "${r.from}" "${r.to}"`).join(' && \\\n'));
    }
}

// Main execution
console.log('NASA Webb Telescope Image Downloader\n');
checkAndRenameExistingFiles();
console.log('\n');
generateDownloadInstructions();