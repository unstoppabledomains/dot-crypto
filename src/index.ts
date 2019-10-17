import chalk from 'chalk'
import yargs = require('yargs')
const pkg = require('../package.json')

const cli = yargs
  .scriptName(pkg.name)
  .demandCommand()
  .middleware(argv => {
    if (process.env.NODE_ENV === 'development') argv.verbose = true
    if (argv.verbose) {
      console.info()
      Object.keys(argv).forEach(k => {
        console.info(k.charAt(0).toUpperCase() + k.slice(1) + ':', argv[k])
      })
      console.info()
    }
  })
  .epilog('Made with ' + chalk.red('♥') + ' by Unstoppable Domains')
  .option('verbose', {
    type: 'boolean',
    alias: 'v',
    description: 'Use verbose logging',
  })
  .version()
  .help()
  .alias('help', 'h')
  // .showHelpOnFail(true)
  .command(require('./handler'))
  .command(require('./send'))
  .fail((msg, err) => {
    if (err || !msg) {
      console.error('Error:', err.message || 'unknown')
    }

    cli.showHelp()
    console.error()
    console.error(msg)
    process.exit(1)
  })

cli.argv
