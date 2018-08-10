import Command from '../../base'
import { paginateOctokit, octokit } from '../../request'

export default class Repository extends Command {
  public static description = 'List, Create & Modify Repositorys'

  public async run() {
    console.log('repo')

    const contributors = await octokit.repos.getContributors({
      owner: 'node-gh',
      repo: 'gh',
      anon: 'true',
      per_page: 100,
    })

    const totalContributors = contributors.data.length

    const ghContributors = contributors.data
      .filter(contributor => {
        if (contributor.type === 'Anonymous' || !contributor.login) {
          return false
        }

        return true
      })
      .map(contributor => contributor.login)

    const liferayMembers = await paginateOctokit(octokit.orgs.getMembers, { org: 'liferay' })

    const liferayMemberLogins = liferayMembers
      .reduce<object[]>((dataArr, current: any) => {
        return [...dataArr, ...current]
      }, [])
      .map(member => member.login)

    const contributorsWhoAreLiferayMembers = ghContributors.filter(contributor =>
      liferayMemberLogins.includes(contributor)
    )

    console.log('result', ghContributors.length, contributorsWhoAreLiferayMembers.length)
  }
}
