import { Hook } from '@oclif/config'
const fs = require('fs')
const npmGlobalModulePath = require('global-modules')

const hook: Hook<'command_not_found'> = async function(opts) {
  checkIfPluginExists(opts.id)
  this.exit()
}

function checkIfPluginExists(cmd) {
  const globalNpmPackages: string[] = fs.readdirSync(npmGlobalModulePath)

  const pluginPackageName = globalNpmPackages.find(npmPackage => npmPackage.includes(`gh-${cmd}`))

  console.log('npmGlobalModulePath', pluginPackageName)
}

export default hook
