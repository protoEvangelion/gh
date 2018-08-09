import { flags } from '@oclif/command'
import { ISearchIssuesParams, IRemoteInfo } from '../../interfaces'
import Command from '../../base'
import { paginateOctokit, octokit } from '../../request'
import { trimLeadingSpaces } from '../../utils'
import { chalk, log } from '../../logger'
import cli from 'cli-ux'
import * as moment from 'moment'

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
    const { args, flags } = this.parse(Search)

    runSearchCmd(args.search, this.remoteInfo, flags)
  }
}

export async function runSearchCmd(query, remoteInfo, flags) {
  const isPaginating = flags.all
  const requestObj = mapArgsToObject(query, remoteInfo)
  let issuesArr: object[]

  cli.action.start('Searching through issues')

  if (isPaginating) {
    const response = await paginateOctokit(octokit.search.issues, requestObj)

    issuesArr = response.reduce<object[]>((dataArr, current: any) => {
      return [...dataArr, ...current.items]
    }, [])
  } else {
    try {
      const response = await octokit.search.issues(requestObj)
      issuesArr = response.data.items
    } catch (e) {
      throw new Error(`searching through issues ===> ${e}`)
    }
  }

  if (issuesArr.length > 0) {
    var formattedResponse = formatResponse(issuesArr, flags.detailed, remoteInfo)
  } else {
    throw new Error(`could not find any issues matching the query: ${query}`)
  }

  log.debug(issuesArr)
  log(...formattedResponse)

  cli.action.stop(chalk.greenBright(`Found ${issuesArr.length} issues`))
}

export function mapArgsToObject(query, remoteInfo: IRemoteInfo): ISearchIssuesParams {
  const searchQuery = `${query} is:issue repo:${remoteInfo.repo} user:${remoteInfo.user}`

  return { q: searchQuery }
}

export function formatResponse(response, showDetailedView, remoteInfo: IRemoteInfo): string[] {
  const formattedResponses = response.map(issue => {
    let dateCreated = moment(issue.created_at).fromNow()

    let formattedIssue = `${chalk.green(`#${issue.number}`)} ${issue.title} ${chalk.magenta(
      `@${issue.user.login} (${dateCreated})`
    )}`

    if (showDetailedView) {
      let labels: string = ''
      const labelsExist = issue.labels.length > 0

      if (labelsExist) {
        labels = `\n ${chalk.yellow('Labels:')} ${issue.labels.map(label => label.name).join(',')}`
      }

      const url = chalk.cyan(
        `https://github.com/${remoteInfo.user}/${remoteInfo.repo}/issues/${issue.number}`
      )

      formattedIssue = `
        ${formattedIssue}
        ${url} ${labels}
        ${issue.body}
      `
    }

    return trimLeadingSpaces(formattedIssue)
  })

  return formattedResponses
}
