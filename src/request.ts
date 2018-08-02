import { GraphQLClient } from 'graphql-request'
import { config } from './config'
import * as Octokit from '@octokit/rest'

const octokit = new Octokit()

octokit.authenticate({
  type: 'oauth',
  token: config.github_token,
})

const graphQL = new GraphQLClient('https://api.github.com/graphql', {
  headers: {
    Authorization: `Bearer ${config.github_token}`,
  },
})

export { octokit, graphQL }
