import { IRepoIssue, IRemoteInfo } from '../../interfaces'
import Command from '../../base'
import { compressQuery, trimLeadingSpaces } from '../../utils'
import { graphQL } from '../../request'
import { chalk, log } from '../../logger'

export default class Comment extends Command {
  public static args = [
    {
      name: 'number',
      required: true,
      description: 'Number of the issue you would like to comment on',
    },
    {
      name: 'message',
      required: true,
      description: 'The comment message you would like to add to the issue.',
    },
  ]

  public static description = 'Comment on an issue'

  public static flags = {
    ...Command.flags,
  }

  public async run() {
    const { args } = this.parse(Comment)

    runCommentCmd(args, this.remoteInfo)
  }
}

export async function runCommentCmd(args, remoteInfo: IRemoteInfo) {
  if (!args.message) {
    throw new Error(
      'please add the comment flag with a string you would like to comment on an issue with.'
    )
  }

  if (!args.number) {
    throw new Error(
      'please add the number flag with the number of the issue you would like to comment on.'
    )
  }

  const query = mapArgsToQuery(args, remoteInfo)
  log.debug(query)

  try {
    var queryResponse = await graphQL.request<IRepoIssue>(query)
  } catch (e) {
    throw new Error(`getting issue by number with graphQL query ===> ${e}`)
  }

  const mutationString = mapResponseToMutation(args, queryResponse)

  log.debug(JSON.stringify(queryResponse, null, 4))
  log.debug(mutationString)

  try {
    var mutationResponse = await graphQL.request<IRepoIssue>(mutationString)
  } catch (e) {
    throw new Error(`adding comment to issue with graphQL mutation ===> ${e}`)
  }

  const formattedResponse = formatResponse(args, mutationResponse)

  log.debug(JSON.stringify(mutationResponse, null, 4))
  log(formattedResponse)
}

export function mapArgsToQuery(args, remoteInfo: IRemoteInfo): string {
  const { repo, user } = remoteInfo

  const query = `
    {
      repository(owner: "${user}", name: "${repo}") {
        issue(number: ${args.number}) {
          id
        }
      }
    }
  `

  return compressQuery(query)
}

export function mapResponseToMutation(args, response): string {
  const issueId = response.repository.issue.id

  const mutation = `
    mutation {
      addComment(input: { subjectId: "${issueId}", body: "${args.message}"}) {
        commentEdge {
          node {
            url
          }
        }
      }
    }
  `

  return compressQuery(mutation)
}

export function formatResponse(args, response): string {
  const issueCommentUrl = response.addComment.commentEdge.node.url

  const formattedResponse = `
    Adding comment on issue ${chalk.green(`#${args.number}`)}
    ${issueCommentUrl}
  `

  return trimLeadingSpaces(formattedResponse)
}
