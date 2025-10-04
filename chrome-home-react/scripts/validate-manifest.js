import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const REQUIRED_FIELDS = [
  'manifest_version',
  'name',
  'version',
  'description'
]

const MANIFEST_PATH = path.join(__dirname, '../dist/manifest.json')

function validateManifest() {
  console.log('📋 Validating Chrome extension manifest...')
  
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error('❌ Manifest file not found at:', MANIFEST_PATH)
    process.exit(1)
  }
  
  let manifest
  try {
    const content = fs.readFileSync(MANIFEST_PATH, 'utf8')
    manifest = JSON.parse(content)
  } catch (error) {
    console.error('❌ Failed to parse manifest.json:', error.message)
    process.exit(1)
  }
  
  // Check required fields
  const missingFields = REQUIRED_FIELDS.filter(field => !manifest[field])
  if (missingFields.length > 0) {
    console.error('❌ Missing required fields:', missingFields.join(', '))
    process.exit(1)
  }
  
  // Validate manifest version
  if (manifest.manifest_version !== 3) {
    console.error('❌ Manifest version must be 3 for Chrome Web Store')
    process.exit(1)
  }
  
  // Validate version format
  const versionRegex = /^\d+\.\d+\.\d+$/
  if (!versionRegex.test(manifest.version)) {
    console.warn('⚠️  Version should follow semantic versioning (x.y.z):', manifest.version)
  }
  
  // Check description length
  if (manifest.description.length > 132) {
    console.error('❌ Description exceeds 132 characters limit')
    process.exit(1)
  }
  
  // Validate permissions
  if (manifest.permissions) {
    const deprecatedPermissions = ['tabs', 'webRequest', 'webRequestBlocking']
    const hasDeprecated = manifest.permissions.filter(p => deprecatedPermissions.includes(p))
    if (hasDeprecated.length > 0) {
      console.warn('⚠️  Using deprecated permissions:', hasDeprecated.join(', '))
    }
  }
  
  // Check for required icons
  if (!manifest.icons || Object.keys(manifest.icons).length === 0) {
    console.warn('⚠️  No icons defined. Consider adding 16, 48, and 128px icons')
  }
  
  // Validate CSP if present
  if (manifest.content_security_policy) {
    if (typeof manifest.content_security_policy === 'string') {
      console.error('❌ CSP must be an object with extension_pages property for Manifest V3')
      process.exit(1)
    }
  }
  
  console.log('✅ Manifest validation passed!')
  console.log(`   Name: ${manifest.name}`)
  console.log(`   Version: ${manifest.version}`)
  console.log(`   Description: ${manifest.description}`)
  
  // Update package.json version to match
  const packagePath = path.join(__dirname, '../package.json')
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
  if (packageJson.version !== manifest.version) {
    packageJson.version = manifest.version
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n')
    console.log(`✅ Updated package.json version to ${manifest.version}`)
  }
}

validateManifest()