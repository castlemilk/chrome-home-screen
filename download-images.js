// Script to download JWST images for local caching
const https = require('https');
const fs = require('fs');
const path = require('path');

// Using NASA's official images at reasonable resolutions
const jwstImages = [
    {
        id: 'deep-field',
        url: 'https://www.nasa.gov/wp-content/uploads/2023/03/main_image_deep_field_smacs0723-1280.jpg',
        filename: 'deep-field.jpg'
    },
    {
        id: 'carina-nebula',
        url: 'https://www.nasa.gov/wp-content/uploads/2023/03/main_image_star-forming_region_carina_nircam_final-1280.jpg',
        filename: 'carina-nebula.jpg'
    },
    {
        id: 'southern-ring',
        url: 'https://www.nasa.gov/wp-content/uploads/2023/03/main_image_planetary_nebula_ngc3132_miri_nircam_sidebyside-1280.jpg',
        filename: 'southern-ring.jpg'
    },
    {
        id: 'stephans-quintet',
        url: 'https://www.nasa.gov/wp-content/uploads/2023/03/main_image_galaxies_stephans_quintet_sq_nircam_miri_final-1280.jpg',
        filename: 'stephans-quintet.jpg'
    },
    {
        id: 'tarantula-nebula',
        url: 'https://webb.nasa.gov/content/webbLaunch/assets/images/firstImages/GSFC_20220906_Tarantula_NGC2070_NIRCam_2000.jpg',
        filename: 'tarantula-nebula.jpg'
    },
    {
        id: 'cartwheel-galaxy',
        url: 'https://www.nasa.gov/wp-content/uploads/2023/03/stsci-01g9g444gb9m08hg5xh60yfqnr.png',
        filename: 'cartwheel-galaxy.jpg'
    },
    {
        id: 'pillars-creation',
        url: 'https://www.nasa.gov/wp-content/uploads/2023/03/stsci-01gfnn3pwjmy4rqxkz585bc4qh-1280x1065.png',
        filename: 'pillars-creation.jpg'
    },
    {
        id: 'orion-nebula',
        url: 'https://www.nasa.gov/wp-content/uploads/2023/03/orion-nebula-jwst-nircam-1280x1280.jpg',
        filename: 'orion-nebula.jpg'
    },
    {
        id: 'rho-ophiuchi',
        url: 'https://www.nasa.gov/wp-content/uploads/2023/07/main_image_webb-anniversary-scaled.jpg',
        filename: 'rho-ophiuchi.jpg'
    },
    {
        id: 'ring-nebula',
        url: 'https://www.nasa.gov/wp-content/uploads/2023/08/stsci-01h82t5x652kzfxwg06nhcfakt.png',
        filename: 'ring-nebula.jpg'
    }
];

function downloadImage(imageInfo) {
    return new Promise((resolve, reject) => {
        const filePath = path.join(__dirname, 'images', 'jwst', imageInfo.filename);
        
        // Check if file already exists and has content
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            if (stats.size > 0) {
                console.log(`✓ ${imageInfo.filename} already exists`);
                resolve();
                return;
            } else {
                // Remove empty file
                fs.unlinkSync(filePath);
            }
        }
        
        console.log(`Downloading ${imageInfo.filename}...`);
        const file = fs.createWriteStream(filePath);
        
        https.get(imageInfo.url, (response) => {
            // Handle redirects
            if (response.statusCode === 301 || response.statusCode === 302) {
                https.get(response.headers.location, (redirectResponse) => {
                    redirectResponse.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        console.log(`✓ Downloaded ${imageInfo.filename}`);
                        resolve();
                    });
                }).on('error', reject);
                return;
            }
            
            if (response.statusCode !== 200) {
                file.close();
                fs.unlink(filePath, () => {});
                reject(new Error(`Failed to download ${imageInfo.filename}: ${response.statusCode}`));
                return;
            }
            
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log(`✓ Downloaded ${imageInfo.filename}`);
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filePath, () => {});
            reject(err);
        });
    });
}

async function downloadAllImages() {
    console.log('Starting JWST image downloads...');
    
    for (const image of jwstImages) {
        try {
            await downloadImage(image);
        } catch (error) {
            console.error(`Error downloading ${image.filename}:`, error.message);
        }
    }
    
    console.log('Download complete!');
}

// Run the download
downloadAllImages();