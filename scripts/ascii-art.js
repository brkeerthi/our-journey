const chalk = require('chalk')

const showAsciiArt = (mode) => {
  const asciiArt = `
    ____              __                                    
   / __ \\__  _______/_/_____  __  ___________  ___  __  __
  / / / / / / / ___/ / __ \\ \\/ / / ___/ ___/ / _ \\/ / / /
 / /_/ / /_/ / /  / / /_/ /\\  / / /  / /    /  __/ /_/ / 
/_____/\\__,_/_/  /_/\\____/ /_/ /_/  /_/     \\___/\\__, /  
                                                 /____/   

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