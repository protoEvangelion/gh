import { flags } from '@oclif/command'
import { IStateIssueParams, IRemoteInfo } from '../../interfaces'
import Command from '../../base'
import { octokit } from '../../request'
import { trimLeadingSpaces } from '../../utils'
import { chalk, log } from '../../logger'

export const stateCmdFlags = {
  open: flags.boolean({
    char: 'o',
    description: 'Open an issue',
  }),
  close: flags.boolean({
    char: 'C',
    description: 'Close an issue',
  }),
}

export default class State extends Command {
  public static args = [
    {
      name: 'number',
      required: true,
      description: 'Number of the issue you would like to open or close',
    },
  ]

  public static description = 'Open or close an issue'

  public static flags = {
    ...Command.flags,
    ...stateCmdFlags,
  }

  public async run() {
    const { args, flags } = this.parse(State)

    runStateCmd(args.number, flags, this.remoteInfo)
  }
}

export async function runStateCmd(number, flags, remoteInfo) {
  try {
    var response = await octokit.issues.edit(mapArgsToRequestObject(number, flags, remoteInfo))
  } catch (e) {
    throw new Error(`opening or closing an issue ===> ${e}`)
  }

  if (response.status === 200) {
    var formattedResponse = formatResponse(number, remoteInfo, flags)
  } else {
    throw new Error(`opening or closing an issue exited with status of ${response.status}`)
  }

  log.debug(response)
  log(formattedResponse)
}

export function mapArgsToRequestObject(number, flags, remoteInfo: IRemoteInfo): IStateIssueParams {
  const requestObj: IStateIssueParams = {
    number,
    owner: remoteInfo.user,
    repo: remoteInfo.repo,
    state: flags.open ? 'open' : 'closed',
  }

  return requestObj
}

export function formatResponse(number, remoteInfo: IRemoteInfo, flags): string {
  const state = flags.open ? 'Opening' : 'Closing'

  const formattedResponse = `
    ${state} issue on ${chalk.green(`${remoteInfo.user}/${remoteInfo.repo}`)}
    https://github.com/${remoteInfo.user}/${remoteInfo.repo}/issues/${number}
  `

  return trimLeadingSpaces(formattedResponse)
}
