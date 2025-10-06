#!/usr/bin/env node
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Get version from git tag, falling back to package.json
 * Priority: git tag > package.json
 */
function getVersion() {
  try {
    // Try to get the latest git tag
    const gitTag = execSync('git describe --tags --abbrev=0', { encoding: 'utf8' }).trim()
    // Remove 'v' prefix if present
    return gitTag.startsWith('v') ? gitTag.substring(1) : gitTag
  } catch (error) {
    // If no git tags exist, fall back to package.json
    const packagePath = path.join(__dirname, '../package.json')
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
    return packageJson.version
  }
}

// If called directly, output the version
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(getVersion())
}

export { getVersion }
