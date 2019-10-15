export const command = 'deploy [dir]'

export const desc = 'Create an empty repo'

export const builder = {
  dir: {
    default: '.',
  },
}

export const handler = function(argv) {
  console.log('init called for dir', argv.dir)
  console.log(argv)
}
