import Command from '../../base'
import { IFlags } from '../../interfaces'
import { runCommentCmd } from './comment'
import { newCmdFlags, runNewCmd } from './new'
import { listCmdFlags } from './list'
import { forEach } from 'lodash'

function generateFlags() {
  const flagsArr = [
    { flags: { ...Command.flags }, namespace: 'global' },
    { flags: { ...listCmdFlags }, namespace: 'issue:list' },
    { flags: { ...newCmdFlags }, namespace: 'issue:new' },
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

export default class Issue extends Command {
  public static args = [
    {
      name: 'number_or_title',
      required: false,
      description:
        'Number of the issue you would like to comment on OR the text message of a new issue',
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
