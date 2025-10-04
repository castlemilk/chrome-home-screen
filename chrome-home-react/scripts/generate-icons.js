import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ICONS_DIR = path.join(__dirname, '../public/icons')

// Create icons directory if it doesn't exist
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true })
}

// SVG icon template - a simple home icon
const createSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="url(#bg)"/>
  <path d="M ${size * 0.5} ${size * 0.25} 
           L ${size * 0.75} ${size * 0.45} 
           L ${size * 0.75} ${size * 0.75} 
           L ${size * 0.25} ${size * 0.75} 
           L ${size * 0.25} ${size * 0.45} 
           Z" 
        fill="white" 
        opacity="0.9"/>
  <path d="M ${size * 0.35} ${size * 0.2} 
           L ${size * 0.5} ${size * 0.1} 
           L ${size * 0.65} ${size * 0.2}" 
        stroke="white" 
        stroke-width="${size * 0.03}" 
        fill="none" 
        stroke-linecap="round" 
        opacity="0.9"/>
</svg>
`

// Generate icons for different sizes
const sizes = [16, 48, 128]

console.log('🎨 Generating extension icons...')

sizes.forEach(size => {
  const svg = createSVG(size)
  const filename = path.join(ICONS_DIR, `icon${size}.svg`)
  fs.writeFileSync(filename, svg.trim())
  console.log(`✅ Created icon${size}.svg`)
})

// Also create a promotional icon (used in Chrome Web Store)
const promoSVG = createSVG(440)
fs.writeFileSync(path.join(ICONS_DIR, 'icon-promo.svg'), promoSVG.trim())
console.log('✅ Created promotional icon (440x280)')

console.log('\n📦 Icons generated successfully!')
console.log('Note: For production, consider creating proper PNG icons with a design tool.')