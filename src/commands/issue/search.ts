import { flags } from '@oclif/command'
import { ISearchIssuesParams, IRemoteInfo } from '../../interfaces'
import Command from '../../base'
import { octokit } from '../../request'
import { trimLeadingSpaces } from '../../utils'
import { chalk, log } from '../../logger'

export const searchCmdFlags = {
  all: flags.boolean({ char: 'a', description: 'Search all issues' }),
  detailed: flags.boolean({ char: 'd', description: 'Show detailed version of issues' }),
}

export default class Search extends Command {
  public static args = [
    {
      name: 'search',
      required: true,
      description:
        'GitHub search query (https://help.github.com/articles/searching-issues-and-pull-requests/)',
    },
  ]

  public static description = 'Search for issues by repo, user, & GitHub search query'

  public static flags = {
    ...Command.flags,
    ...searchCmdFlags,
  }

  public async run() {
    const { args } = this.parse(Search)

    runSearchCmd(args.search, this.remoteInfo)
  }
}

export async function runSearchCmd(query, remoteInfo) {
  try {
    var response = await octokit.search.issues(mapArgsToObject(query, remoteInfo))
  } catch (e) {
    throw new Error(`searching through issues ===> ${e}`)
  }

  // if (response.status === 200) {
  //   var formattedResponse = formatResponse(remoteInfo, response.data)
  // } else {
  //   throw new Error(`searching through issues exited with status of ${response.status}`)
  // }

  log.debug(response)
  // log(formattedResponse)
}

export function mapArgsToObject(query, remoteInfo: IRemoteInfo): ISearchIssuesParams {
  const searchQuery = `${query} is:issue repo: ${remoteInfo.repo} user:${remoteInfo.user}`

  console.log('searchQuery', searchQuery)

  return { q: searchQuery }
}

export function formatResponse(remoteInfo: IRemoteInfo, newIssueNumber): string {
  const formattedResponse = `
    Creating a new issue on ${chalk.green(`${remoteInfo.user}/${remoteInfo.repo}`)}
    https://github.com/${remoteInfo.user}/${remoteInfo.repo}/issues/${newIssueNumber}
  `

  return trimLeadingSpaces(formattedResponse)
}
