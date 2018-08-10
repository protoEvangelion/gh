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

// TODO: set env for this: DEBUG=octokit:rest*

async function paginateOctokit(method, requestObj) {
  let dataArr: object[] = []

  const paginatedRequestObj = {
    ...requestObj,
    per_page: 100,
    // per_page: config.api.request_per_page_limit,
  }

  try {
    var response = await method(paginatedRequestObj)
    dataArr.push(response.data)
  } catch (e) {
    throw new Error(`error paginating ${method} ===> ${e}`)
  }

  while (octokit.hasNextPage(response)) {
    try {
      response = await octokit.getNextPage(response)
      dataArr.push(response.data)
    } catch (e) {
      throw new Error(`error paginating ${method} ===> ${e}`)
    }
  }

  return dataArr
}

export { octokit, graphQL, paginateOctokit }
