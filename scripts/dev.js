const { execSync } = require('child_process')
const { showAsciiArt } = require('./ascii-art')
const chalk = require('chalk')

showAsciiArt('development')

try {
  execSync('next dev', { stdio: 'inherit' })
} catch (error) {
  console.error(chalk.red('\n❌ Development server failed to start\n'))
  process.exit(1)
} 