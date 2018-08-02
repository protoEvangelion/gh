import { expect } from '@oclif/test'
import { stdout } from '../mock/stdout'
import { responses } from '../mock/responses'
import { queries } from '../mock/queries'
import { user, repo } from '../mock/user'
import {
  formatResponse,
  mapArgsToQuery,
  mapResponseToMutation,
} from '../../../src/commands/issue/comment'
import { compressQuery } from '../../../src/utils'

const args = { comment: 'My comment', number: 1 }

describe('`issue:comment` Maps args to graphQL query & mutation', () => {
  const remoteInfo = {
    user,
    repo,
    remote: 'origin',
  }

  it(`builds query for: issue:comment ${args.number} "${args.comment}"`, () => {
    const mockQuery = queries.issue.comment.base

    const query = compressQuery(mapArgsToQuery(args, remoteInfo))

    expect(query).to.equal(mockQuery)
  })

  it(`builds mutation for: issue:comment ${args.number} "${args.comment}"`, () => {
    const mockMutation = queries.issue.comment.mutation
    const mockQueryResponse = JSON.parse(responses.issue.comment.query)

    const mutation = compressQuery(mapResponseToMutation(args, mockQueryResponse))

    expect(mutation).to.equal(mockMutation)
  })
})

describe('`issue:comment` Formats/Converts response object correctly for console', () => {
  it(`formats response for: issue:comment ${args.number} "${args.comment}"`, () => {
    const mockMutationResponse = JSON.parse(responses.issue.comment.mutation)
    const mockStdout = stdout.issue.comment.base
    const formattedResponse = formatResponse(args, mockMutationResponse)

    expect(formattedResponse).to.equal(mockStdout)
  })
})
