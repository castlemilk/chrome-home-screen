#!/usr/bin/env node
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const bumpType = process.argv[2] || 'patch' // major, minor, patch

if (!['major', 'minor', 'patch'].includes(bumpType)) {
  console.error('❌ Invalid bump type. Use: major, minor, or patch')
  process.exit(1)
}

function getCurrentVersion() {
  try {
    const gitTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim()
    return gitTag.startsWith('v') ? gitTag.substring(1) : gitTag
  } catch {
    const packagePath = path.join(__dirname, '../package.json')
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
    return packageJson.version
  }
}

function bumpVersion(version, type) {
  const [major, minor, patch] = version.split('.').map(Number)
  
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`
    case 'minor':
      return `${major}.${minor + 1}.0`
    case 'patch':
      return `${major}.${minor}.${patch + 1}`
    default:
      throw new Error('Invalid bump type')
  }
}

function updateFiles(newVersion) {
  // Update package.json
  const packagePath = path.join(__dirname, '../package.json')
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
  packageJson.version = newVersion
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n')
  
  // Update manifest.json
  const manifestPath = path.join(__dirname, '../public/manifest.json')
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  manifest.version = newVersion
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
}

// Main
const currentVersion = getCurrentVersion()
const newVersion = bumpVersion(currentVersion, bumpType)

console.log(`📦 Bumping version: ${currentVersion} → ${newVersion}`)

// Update files
updateFiles(newVersion)

console.log(`✅ Updated package.json and manifest.json to v${newVersion}`)
console.log(`\n📝 Next steps:`)
console.log(`   1. git add package.json public/manifest.json`)
console.log(`   2. git commit -m "Bump version to ${newVersion}"`)
console.log(`   3. git tag -a v${newVersion} -m "Release v${newVersion}"`)
console.log(`   4. git push && git push --tags`)
console.log(`   5. make release`)
