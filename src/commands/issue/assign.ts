import Command from '../../base'
import { octokit } from '../../request'
import { chalk, log } from '../../logger'
import { trimLeadingSpaces } from '../../utils'

export default class Assign extends Command {
  public static args = [
    {
      name: 'number',
      required: true,
      description: 'Number of the issue you would like to assign a user to',
    },
    {
      name: 'assignees',
      required: true,
      description: 'Username of assignee. Comma separated if there are multiple assignees',
    },
  ]

  public static description =
    'Adds up to 10 assignees to an issue. Users already assigned to an issue are not replaced.'

  public static flags = {
    ...Command.flags,
  }

  public async run() {
    const { args } = this.parse(Assign)

    runAssignCmd(args, this.remoteInfo)
  }
}

export async function runAssignCmd(args, remoteInfo) {
  try {
    var response = await octokit.issues.addAssigneesToIssue(mapArgsToObject(args, remoteInfo))
  } catch (e) {
    throw new Error(`assigning issue \n: ${e}`)
  }

  if (response.status !== 201) {
    throw new Error(`assigning an issue responded with ${response.status}`)
  }

  const formattedResponse = formatResponse(args, remoteInfo, response)

  log.debug(response.status)
  log(formattedResponse)
}

export function mapArgsToObject(args, remoteInfo) {
  return {
    owner: remoteInfo.user,
    repo: remoteInfo.repo,
    number: args.number,
    assignees: args.assignees.split(','),
  }
}

export function formatResponse(args, remoteInfo, response): string {
  const { repo, user } = remoteInfo

  const currentAssignees: string[] = response.data.assignees.map(assignee => assignee.login)

  const assigneesAdded: boolean = args.assignees
    .split(',')
    .every(assignee => currentAssignees.includes(assignee))

  if (assigneesAdded) {
    const number = chalk.green(`#${args.number}`)
    const userAndRepo = chalk.green(`${user}/${repo}`)

    const formattedResponse = `
      Assigning issue ${number} on ${userAndRepo} to ${chalk.green(args.assignees)}
      ${chalk.yellow('Current Assignee(s):')} ${currentAssignees.join(', ')}
      ${chalk.cyan(`https://github.com/${user}/${repo}/issues/${args.number}`)}
    `

    return trimLeadingSpaces(formattedResponse)
  }

  return chalk.bold.red('Assignee(s) not added')
}
