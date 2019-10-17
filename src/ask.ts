import {createInterface} from 'readline'

export default async function ask(question = 'Continue?') {
  let answered
  do {
    answered = await new Promise(resolve => {
      const readlineInterface = createInterface(process.stdin, process.stdout)

      readlineInterface.on('SIGINT', () => {
        console.log('\nStopping...')
        process.exit()
      })

      readlineInterface.question(question + ' [Y/n] ', answer => {
        readlineInterface.close()
        if (/^(?:[Y|y](?:es)?)?$/.test(answer)) {
          resolve(true)
        } else if (/^(?:[N|n]o?)?$/.test(answer)) {
          console.log('Stopping...')
          process.exit(1)
        } else {
          resolve(false)
        }
      })
    })
  } while (!answered)
}
