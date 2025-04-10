const chalk = require('chalk')

const showAsciiArt = (mode) => {
  const asciiArt = `

  ╭──────────────────────────────────────────────╮
   │        Built with ❤️  from Keerthi           
   │             to Rakshitha                     
  ╰──────────────────────────────────────────────╯
`

  console.log(chalk.magenta(asciiArt))
  console.log(chalk.yellow(`Starting Our Journey in ${mode} mode...`))
  console.log(chalk.dim('============================================='))
}

module.exports = { showAsciiArt } 