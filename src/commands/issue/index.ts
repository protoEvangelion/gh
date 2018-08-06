import Command from '../../base'
import { flags } from '@oclif/command'
import { runCommentCmd } from './comment'
import { newCmdFlags, runNewCmd } from './new'

export default class Issue extends Command {
  public static args = [
    {
      name: 'number_or_title',
      required: true,
      description:
        'Number of the issue you would like to comment on OR the text message of a new issue',
    },
    {
      name: 'comment_or_body',
      required: true,
      description:
        'Comment message you would like to add to the issue OR the body message of a new issue',
    },
  ]

  public static description = 'List, Create & Modify issues'

  public static flags = {
    ...Command.flags,
    ...newCmdFlags,
    help: flags.help({ char: 'h' }),
  }

  public async run() {
    const { args, flags } = this.parse(Issue)

    const firstArgIsNumber = Number(args.number_or_title)

    if (firstArgIsNumber) {
      const adjustedArgs = {
        number: args.number_or_title,
        message: args.comment_or_body,
      }

      runCommentCmd(adjustedArgs, this.remoteInfo)
    } else {
      const adjustedFlags = {
        ...flags,
        title: args.number_or_title,
        message: args.comment_or_body,
      }

      runNewCmd(adjustedFlags, this.remoteInfo)
    }
  }
}
