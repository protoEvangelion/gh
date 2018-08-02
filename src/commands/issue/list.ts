import { flags } from '@oclif/command'
import { IRepoIssues, IPaginationInfo, IRemoteInfo } from '../../interfaces'
import * as moment from 'moment'
import Command from '../../base'
import { config } from '../../config'
import { graphQL } from '../../request'
import { compressQuery, trimLeadingSpaces } from '../../utils'
import { chalk, log } from '../../logger'

export default class List extends Command {
  public static description = 'List & filter issues'

  public static flags = {
    ...Command.flags,
    help: flags.help({ char: 'h' }),
    all: flags.boolean({ char: 'a', description: 'List all issues' }),
    assignee: flags.string({
      char: 'A',
      description: 'Filter issues by assignee(case sensitive) login id',
    }),
    detailed: flags.boolean({ char: 'd', description: 'Show detailed version of issues' }),
    label: flags.string({
      char: 'L',
      description: 'Filter issues by label(s). If multiple labels they should be comma separated',
    }),
    milestone: flags.string({
      char: 'M',
      description: 'Filter issues by milestone (case insensitive)',
    }),
    state: flags.string({ char: 'S', description: 'Filter by closed or open issues' }),
  }

  public async run() {
    const { flags } = this.parse(List)

    let paginationInProgress = flags.all

    if (paginationInProgress) {
      let paginationCursor = null

      while (paginationInProgress) {
        const pageInfo = await orchestrate(
          flags,
          this.remoteInfo,
          paginationInProgress,
          paginationCursor
        )

        paginationInProgress = pageInfo.hasPreviousPage
        paginationCursor = pageInfo.startCursor
      }
    } else {
      orchestrate(flags, this.remoteInfo, false)
    }
  }
}

export async function orchestrate(
  flags,
  remoteInfo: IRemoteInfo,
  paginationInProgress,
  paginationCursor?
): Promise<IPaginationInfo> {
  let query = mapArgsToQuery(flags, remoteInfo, paginationInProgress, paginationCursor)
  log.query(query)

  let response = await queryIssues(query)
  log.debug(JSON.stringify(response.repository.issues, null, 4))

  let formattedIssues = formatResponse(flags, response)
  log(...formattedIssues)

  return response.repository.issues.pageInfo
}

export function mapArgsToQuery(
  flags,
  remoteInfo: IRemoteInfo,
  paginationInProgress,
  paginationCursor?
): string {
  let assigneeField = ''
  let beforeArgument = ''
  let detailedField = ''
  let labelsArgument = ''
  let labelsField = ''
  let milestoneField = ''
  let numberOfItems = config.graphql.node_limit
  let paginationFields = ''
  let statesArgument = ''

  const { repo, user } = remoteInfo

  if (paginationInProgress) {
    beforeArgument = paginationCursor ? `before: "${paginationCursor}",` : ''
    numberOfItems = config.graphql.pagination_node_limit

    paginationFields = `
      pageInfo {
        startCursor
        hasPreviousPage
      }
    `
  }

  if (flags.assignee) {
    assigneeField = `
      assignees(first: 100) {
        edges {
          node {
            login
          }
        }
      }
    `
  }

  if (flags.detailed) {
    detailedField = `
      bodyText
      url
    `
  }

  if (flags.label) {
    const labelsArr = flags.label.split(',').map(label => `"${label.trim()}"`)
    labelsArgument = `labels: [${labelsArr}]`

    labelsField = `
      labels(first: 100) {
        edges {
          node {
            name
          }
        }
      }
    `
  }

  if (flags.milestone) {
    milestoneField = `
      milestone {
        title
      }
    `
  }

  if (flags.state) {
    const state = (flags.state || 'OPEN').toLocaleUpperCase()

    statesArgument = `states: ${state}`
  }

  const query = `
    {
      repository(
        owner: "${user}",
        name: "${repo}"
      ) {
        issues(
          ${beforeArgument}
          ${labelsArgument}
          last: ${numberOfItems},
          ${statesArgument}
        ) {
          edges {
            node {
              ${assigneeField}
              ${detailedField}
              ${labelsField}
              ${milestoneField}

              author {
                login
              }
              createdAt
              number
              title
              url
            }
          }
          ${paginationFields}
        }
      }
    }
  `

  return compressQuery(query)
}

export async function queryIssues(query): Promise<IRepoIssues> {
  let response

  try {
    response = await graphQL.request<IRepoIssues>(query)
  } catch (e) {
    throw new Error(`making GitHub graphQL request ===> ${e}`)
  }

  return response
}

export function formatResponse(flags, response): string[] {
  const issues = response.repository.issues
  const issuesLength = issues.edges.length - 1

  const formattedIssues: string[] = []
  let node

  for (let i = issuesLength; i >= 0; i--) {
    node = issues.edges[i].node

    if (flags.assignee) {
      const assignees = node.assignees.edges.filter(
        assignee => assignee.node.login === flags.assignee
      )

      if (assignees.length === 0) {
        continue
        // todo : handle messaging when no assignees get returned
      }
    }

    if (flags.label) {
      // Check if issue contains ALL labels passed in
      const labels: string[] = flags.label.split(',').map(label => label.trim())
      const returnedLabels: string = node.labels.edges.map(label => label.node.name).join(',')
      const issueContainsLabels: boolean = labels.every(label => returnedLabels.includes(label))

      if (!issueContainsLabels) {
        continue
      }
    }

    if (flags.milestone) {
      if (!node.milestone) {
        continue
      }

      if (node.milestone.title.toLocaleUpperCase() !== flags.milestone.toLocaleUpperCase()) {
        continue
      }
    }

    let dateCreated = moment(node.createdAt).fromNow()

    let formattedIssue = `${chalk.green(`#${node.number}`)} ${node.title} ${chalk.magenta(
      `@${node.author.login} (${dateCreated})`
    )}`

    if (flags.detailed) {
      formattedIssue = `
        ${formattedIssue}
        ${chalk.cyan(node.url)}
        ${node.bodyText}
      `
    }

    formattedIssues.push(trimLeadingSpaces(formattedIssue))
  }

  return formattedIssues
}
