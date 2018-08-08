import { formatUrl } from '../../../src/commands/issue/browser'
import { user, repo } from '../mock/user'
import { expect } from '@oclif/test'

const remoteInfo = {
  user,
  repo,
}

describe('`issue:browser` ', () => {
  it('Formats url correctly when passing in number', () => {
    const url = formatUrl(1, remoteInfo)

    expect(url).to.equal('https://github.com/protoEvangelion/gh/issues/1')
  })
})
