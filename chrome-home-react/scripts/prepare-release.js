import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const ROOT_DIR = path.join(__dirname, '..')
const DIST_DIR = path.join(ROOT_DIR, 'dist')
const BUILD_DIR = path.join(ROOT_DIR, 'build')

function prepareRelease() {
  console.log('🚀 Preparing release...\n')
  
  // Check if dist exists
  if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ Dist folder not found. Run "npm run build" first.')
    process.exit(1)
  }
  
  // Get version from manifest
  const manifestPath = path.join(DIST_DIR, 'manifest.json')
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  const version = manifest.version
  
  console.log(`📦 Preparing version ${version}`)
  
  // Create build directory
  if (!fs.existsSync(BUILD_DIR)) {
    fs.mkdirSync(BUILD_DIR)
  }
  
  // Create release info
  const releaseInfo = {
    version,
    name: manifest.name,
    description: manifest.description,
    buildDate: new Date().toISOString(),
    files: []
  }
  
  // Count files in dist
  function countFiles(dir, base = '') {
    const files = fs.readdirSync(dir)
    files.forEach(file => {
      const fullPath = path.join(dir, file)
      const relativePath = path.join(base, file)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory()) {
        countFiles(fullPath, relativePath)
      } else {
        releaseInfo.files.push({
          path: relativePath,
          size: stat.size
        })
      }
    })
  }
  
  countFiles(DIST_DIR)
  
  // Calculate total size
  const totalSize = releaseInfo.files.reduce((sum, file) => sum + file.size, 0)
  releaseInfo.totalSize = totalSize
  releaseInfo.totalSizeMB = (totalSize / 1024 / 1024).toFixed(2)
  
  // Save release info
  const releaseInfoPath = path.join(BUILD_DIR, `release-${version}.json`)
  fs.writeFileSync(releaseInfoPath, JSON.stringify(releaseInfo, null, 2))
  
  // Create zip file with version
  const zipName = `chrome-extension-v${version}.zip`
  const zipPath = path.join(BUILD_DIR, zipName)
  
  console.log(`\n📦 Creating ${zipName}...`)
  execSync(`cd ${DIST_DIR} && zip -r ${zipPath} .`, { stdio: 'inherit' })
  
  // Get zip file size
  const zipStat = fs.statSync(zipPath)
  const zipSizeMB = (zipStat.size / 1024 / 1024).toFixed(2)
  
  // Generate release notes
  const releaseNotes = `
# Chrome Home Extension v${version}

## Release Information
- **Build Date**: ${new Date().toLocaleDateString()}
- **Total Files**: ${releaseInfo.files.length}
- **Uncompressed Size**: ${releaseInfo.totalSizeMB} MB
- **Compressed Size**: ${zipSizeMB} MB

## Installation Instructions
1. Open Chrome and navigate to \`chrome://extensions/\`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the extracted folder
4. Or drag and drop the .zip file to install

## Files Included
- manifest.json
- index.html
- assets/ (JavaScript and CSS bundles)
- images/ (JWST backgrounds)

## Permissions Required
- storage (for saving settings and widgets)

## Host Permissions
- Weather API (wttr.in)
- Stock data (Yahoo Finance)
- Geocoding (Open Meteo)
`
  
  const releaseNotesPath = path.join(BUILD_DIR, `RELEASE-NOTES-v${version}.md`)
  fs.writeFileSync(releaseNotesPath, releaseNotes)
  
  console.log('\n✅ Release preparation complete!\n')
  console.log(`📁 Build artifacts saved to: ${BUILD_DIR}`)
  console.log(`📦 Extension package: ${zipName} (${zipSizeMB} MB)`)
  console.log(`📄 Release notes: RELEASE-NOTES-v${version}.md`)
  console.log(`📊 Release info: release-${version}.json`)
  
  console.log('\n🎯 Next steps:')
  console.log('1. Test the extension locally')
  console.log('2. Create a GitHub release with the zip file')
  console.log('3. Upload to Chrome Web Store Developer Dashboard')
  console.log('   https://chrome.google.com/webstore/devconsole')
}

prepareRelease()