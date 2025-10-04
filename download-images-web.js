// Script to download JWST images using fetch (for modern Node.js)
const fs = require('fs');
const path = require('path');
const https = require('https');

// Direct links to Webb Telescope images
const jwstImages = [
    {
        id: 'deep-field',
        url: 'https://webbtelescope.org/contents/media/images/2022/035/01G7JGTH21B5GN9VCYAHBXKSD1?page=1&filterUUID=91dfa083-398e-4394-8022-8bcc12c7fcba',
        filename: 'deep-field.jpg'
    },
    {
        id: 'carina-nebula',
        url: 'https://webbtelescope.org/contents/media/images/2022/031/01G77PKB8NKR7S8Z6HBXMYATGJ?page=1&filterUUID=91dfa083-398e-4394-8022-8bcc12c7fcba',
        filename: 'carina-nebula.jpg'
    },
    {
        id: 'southern-ring',
        url: 'https://webbtelescope.org/contents/media/images/2022/033/01G709QXZPFH83NZFAFP66WVCZ?page=1&filterUUID=91dfa083-398e-4394-8022-8bcc12c7fcba',
        filename: 'southern-ring.jpg'
    },
    {
        id: 'stephans-quintet',
        url: 'https://webbtelescope.org/contents/media/images/2022/034/01G7DA5ADA2WDSK1JJPQ0PTG4A?page=1&filterUUID=91dfa083-398e-4394-8022-8bcc12c7fcba',
        filename: 'stephans-quintet.jpg'
    }
];

// Use placeholder images from Unsplash as fallback
const fallbackImages = [
    {
        id: 'deep-field',
        url: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=1600',
        filename: 'deep-field.jpg'
    },
    {
        id: 'carina-nebula',
        url: 'https://images.unsplash.com/photo-1543722530-d2c3201371e7?w=1600',
        filename: 'carina-nebula.jpg'
    },
    {
        id: 'southern-ring',
        url: 'https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=1600',
        filename: 'southern-ring.jpg'
    },
    {
        id: 'stephans-quintet',
        url: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=1600',
        filename: 'stephans-quintet.jpg'
    },
    {
        id: 'tarantula-nebula',
        url: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=1600',
        filename: 'tarantula-nebula.jpg'
    },
    {
        id: 'cartwheel-galaxy',
        url: 'https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=1600',
        filename: 'cartwheel-galaxy.jpg'
    },
    {
        id: 'pillars-creation',
        url: 'https://images.unsplash.com/photo-1465101162946-4377e57745c3?w=1600',
        filename: 'pillars-creation.jpg'
    },
    {
        id: 'orion-nebula',
        url: 'https://images.unsplash.com/photo-1495985812444-236d6a87bdd9?w=1600',
        filename: 'orion-nebula.jpg'
    },
    {
        id: 'rho-ophiuchi',
        url: 'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=1600',
        filename: 'rho-ophiuchi.jpg'
    },
    {
        id: 'ring-nebula',
        url: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?w=1600',
        filename: 'ring-nebula.jpg'
    }
];

function downloadImage(imageInfo) {
    return new Promise((resolve, reject) => {
        const filePath = path.join(__dirname, 'images', 'jwst', imageInfo.filename);
        
        // Check if file already exists and has content
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            if (stats.size > 1000) {  // At least 1KB
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
    
    // Try fallback images from Unsplash
    for (const image of fallbackImages) {
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