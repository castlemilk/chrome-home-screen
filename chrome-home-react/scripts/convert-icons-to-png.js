import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ICONS_DIR = path.join(__dirname, '../public/icons')

// Convert SVG to PNG for each size
const sizes = [16, 48, 128]

console.log('🎨 Converting SVG icons to PNG...')

async function convertIcons() {
  for (const size of sizes) {
    const svgPath = path.join(ICONS_DIR, `icon${size}.svg`)
    const pngPath = path.join(ICONS_DIR, `icon${size}.png`)
    
    if (!fs.existsSync(svgPath)) {
      console.warn(`⚠️  icon${size}.svg not found, skipping...`)
      continue
    }
    
    try {
      await sharp(svgPath)
        .resize(size, size)
        .png()
        .toFile(pngPath)
      
      console.log(`✅ Created icon${size}.png`)
    } catch (error) {
      console.error(`❌ Error converting icon${size}.svg:`, error.message)
    }
  }
  
  console.log('\n📦 PNG icons generated successfully!')
}

convertIcons().catch(error => {
  console.error('❌ Conversion failed:', error)
  process.exit(1)
})
