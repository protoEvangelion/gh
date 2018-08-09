import Command from '../../base'
import cli from 'cli-ux'

export default class Browser extends Command {
  public static args = [
    {
      name: 'number',
      required: true,
      description: 'Number of the issue you would like to open in browser',
    },
  ]

  public static description = 'Open issue in browser.'

  public static flags = {
    ...Command.flags,
  }

  public async run() {
    const { args } = this.parse(Browser)

    runBrowserCmd(args.number, this.remoteInfo)
  }
}

export async function runBrowserCmd(number, remoteInfo) {
  await cli.open(formatUrl(number, remoteInfo))
}

export function formatUrl(number, remoteInfo): string {
  return `https://github.com/${remoteInfo.user}/${remoteInfo.repo}/issues/${number}`
}
