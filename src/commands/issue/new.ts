import { flags } from '@oclif/command'
import { INewIssueRequest, IRemoteInfo } from '../../interfaces'
import Command from '../../base'
import { octokit } from '../../request'
import { trimLeadingSpaces } from '../../utils'
import { chalk, log } from '../../logger'

export const newCmdFlags = {
  help: flags.help({ char: 'h' }),
  assignee: flags.string({
    char: 'A',
    description:
      'Logins for Users to assign to this issue NOTE: Only users with push access can set assignees for new issues. Assignees are silently dropped otherwise',
  }),
  label: flags.string({
    char: 'L',
    description:
      'Labels to associate with this issue. NOTE: Only users with push access can set labels for new issues. Labels are silently dropped otherwise',
  }),
  message: flags.string({ char: 'm', description: 'The contents of the issue' }),
  milestone: flags.string({
    char: 'M',
    description:
      'The number of the milestone to associate this issue with. NOTE: Only users with push access can set the milestone for new issues. The milestone is silently dropped otherwise',
  }),
}

export default class New extends Command {
  public static description = 'Create a new issue'

  public static flags = {
    ...Command.flags,
    ...newCmdFlags,
  }

  public async run() {
    const { flags } = this.parse(New)

    runNewCmd(flags, this.remoteInfo)
  }
}

export async function runNewCmd(flags, remoteInfo) {
  try {
    var response = await octokit.issues.create(mapArgsToObject(flags, remoteInfo))
  } catch (e) {
    throw new Error(`creating a new issue ===> ${e}`)
  }

  if (response.status === 201) {
    var formattedResponse = formatResponse(remoteInfo, response.data.number)
  } else {
    throw new Error(`creating a new issue exited with status of ${response.status}`)
  }

  log.debug(response)
  log(formattedResponse)
}

export function mapArgsToObject(flags, remoteInfo: IRemoteInfo): INewIssueRequest {
  const requestObj: INewIssueRequest = {
    owner: remoteInfo.user,
    repo: remoteInfo.repo,
    title: flags.title,
  }

  if (!flags.title) {
    throw new Error('A title is required when creating a new issue.')
  }

  if (flags.message) {
    requestObj.body = flags.message
  }

  if (flags.assignee) {
    requestObj.assignees = flags.assignee.split(',')
  }

  if (flags.milestone) {
    requestObj.milestone = flags.milestone
  }

  if (flags.label) {
    requestObj.labels = flags.label.split(',')
  }

  return requestObj
}

export function formatResponse(remoteInfo: IRemoteInfo, newIssueNumber): string {
  const formattedResponse = `
    Creating a new issue on ${chalk.green(`${remoteInfo.user}/${remoteInfo.repo}`)}
    https://github.com/${remoteInfo.user}/${remoteInfo.repo}/issues/${newIssueNumber}
  `

  return trimLeadingSpaces(formattedResponse)
}
