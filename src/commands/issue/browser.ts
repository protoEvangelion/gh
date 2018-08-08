import Command from '../../base'
import * as openUrl from 'opn'

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

export function runBrowserCmd(number, remoteInfo) {
  openUrl(formatUrl(number, remoteInfo), { wait: false })
}

export function formatUrl(number, remoteInfo): string {
  return `https://github.com/${remoteInfo.user}/${remoteInfo.repo}/issues/${number}`
}
