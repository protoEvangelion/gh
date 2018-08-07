import Command from '../../base'
import { IFlags } from '../../interfaces'
import { runCommentCmd } from './comment'
import { newCmdFlags, runNewCmd } from './new'
import { listCmdFlags, runListCmd } from './list'
import { runStateCmd, stateCmdFlags } from './state'
import { forEach } from 'lodash'
import { flags } from '@oclif/command'

export default class Issue extends Command {
  public static args = [
    {
      name: 'number_or_title',
      required: false,
      description:
        'Number of the issue you would like to target OR the text message of a new issue',
    },
    {
      name: 'comment_or_body',
      required: false,
      description:
        'Comment message you would like to add to the issue OR the body message of a new issue',
    },
  ]

  public static description = 'List, Create & Modify issues'

  public static flags = generateFlags()

  public async run() {
    const { args, flags } = this.parse(Issue)

    const isShortcutForComment = Number(args.number_or_title) && args.comment_or_body
    const isShorcutForListIssues = !args.number_or_title && !args.comment_or_body
    const isShorcutForNewIssue = !Number(args.number_or_title) && args.comment_or_body
    const isShortcutForOpenCloseIssue = Number(args.number_or_title) && (flags.open || flags.close)

    if (isShortcutForComment) {
      const adjustedArgs = {
        number: args.number_or_title,
        message: args.comment_or_body,
      }

      runCommentCmd(adjustedArgs, this.remoteInfo)
    } else if (isShorcutForListIssues) {
      runListCmd(flags, this.remoteInfo)
    } else if (isShorcutForNewIssue) {
      const adjustedFlags = {
        ...flags,
        title: args.number_or_title,
        message: args.comment_or_body,
      }

      runNewCmd(adjustedFlags, this.remoteInfo)
    } else if (isShortcutForOpenCloseIssue) {
      const number = args.number_or_title

      runStateCmd(number, flags, this.remoteInfo)
    }
  }
}

function generateFlags() {
  const flagsArr = [
    { flags: { ...Command.flags, help: flags.help({ char: 'h' }) }, namespace: 'global' },
    { flags: { ...listCmdFlags }, namespace: 'issue:list' },
    { flags: { ...newCmdFlags }, namespace: 'issue:new' },
    { flags: { ...stateCmdFlags }, namespace: 'issue:state' },
  ]

  return flagsArr.reduce((previousFlags, currentFlags) => {
    const { flags } = currentFlags

    let allFlags = { ...previousFlags }

    forEach(flags, (flag: IFlags, key) => {
      let description = `\`${currentFlags.namespace}\` --> ${flag.description}`

      if (previousFlags.hasOwnProperty(key)) {
        description = `${previousFlags[key].description}\n ${description}`
      }

      allFlags[key] = {
        ...flag,
        description,
      }
    })

    return allFlags
  }, {})
}
