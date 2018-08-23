import { Hook } from '@oclif/config'

const hook: Hook<'command_not_found'> = async function(opts) {
  process.stdout.write(opts)
  this.exit()
}

export default hook
