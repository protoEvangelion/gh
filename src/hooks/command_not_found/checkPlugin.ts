import { Hook } from '@oclif/config'
// import { log } from '../../logger'

const fs = require('fs')
const path = require('path')
const npmGlobalModulePath = require('global-modules')

const hook: Hook<'command_not_found'> = async function(opts) {
  const pluginName = getPluginName(opts.id)
  // if (pluginName) {
  // const pluginModule = require(path.join(npmGlobalModulePath, pluginName, 'bin', 'jira.js'))
  console.log('pluginName', path.join(npmGlobalModulePath, pluginName, 'bin', 'jira.js'))

  //   console.log('package', pluginModule)
  // } else {
  //   log('Cmd or plugin does not exist')
  // }

  this.exit()
}

function getPluginName(cmd): string | undefined {
  const globalNpmPackages: string[] = fs.readdirSync(npmGlobalModulePath)

  return globalNpmPackages.find(npmPackage => npmPackage.includes(`gh-${cmd}`))
}

export default hook
