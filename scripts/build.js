const { execSync } = require('child_process')
const { showAsciiArt } = require('./ascii-art')
const chalk = require('chalk')

console.log(`

  ╭──────────────────────────────────────────────╮
            Built with ❤️ from Keerthi           
                  to Rakshitha                     
  ╰──────────────────────────────────────────────╯

Starting Our Journey in production mode...
=============================================`)

showAsciiArt('production')

try {
  execSync('next build', { stdio: 'inherit' })
  console.log(chalk.green('\n✨ Build completed successfully!\n'))
} catch (error) {
  console.error(chalk.red('\n❌ Build failed\n'))
  process.exit(1)
} 