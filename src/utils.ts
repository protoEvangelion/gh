/**
 * © 2013 Liferay, Inc. <https://liferay.com> and Node GH contributors
 * (see file: README.md)
 * SPDX-License-Identifier: BSD-3-Clause
 */

import * as tmp from 'tmp'
import * as open from 'opn'
import { spawnSync, execSyncInteractiveStream } from './exec'
import { readFileSync, writeFileSync } from 'fs'
import * as logger from './logger'
import * as inquirer from 'inquirer'
import * as R from 'ramda'

const testing = process.env.NODE_ENV === 'testing'

// interface GithubResponse {
//     data: object
//     hasNextPage: boolean
// }

// export function fetch({ options, path, paginate = false, payload }): Promise<GithubResponse> {
//     const endpoint = R.path(path.split('.'), R.prop('GitHub', options))

//     return M.Either.fromPromise<GithubResponse>(
//         paginate
//             ? handlePagination({ options, listEndpoint: endpoint, payload })
//             : endpoint(payload).then(res => ({ res, hasNextPage: false }))
//     )
// }

function hasNextPage(res): boolean {
    return R.pathSatisfies(x => x && x.includes('rel="next"'), ['headers', 'link'], res)
}

export function handlePagination({ options, listEndpoint, payload }) {
    return (options.allPages
        ? options.GitHub.paginate(listEndpoint.endpoint.merge(payload))
        : listEndpoint({ ...payload, per_page: options.pageSize })
    ).then(data => ({
        hasNextPage: hasNextPage(data),
        data: R.defaultTo(data, data.data),
    }))
}

/**
 * Opens url in browser
 */
export function openUrl(url) {
    testing ? console.log(url) : open(url, { wait: false })
}

/**
 * Checks if string has been merged with a common flag or is empty
 */
export function userLeftMsgEmpty(string: string): boolean {
    return (
        !string ||
        string === '--title' ||
        string === '-t' ||
        string === '--message' ||
        string === '-m' ||
        string === '--comment' ||
        string === '-c' ||
        string === '--description' ||
        string === '-D'
    )
}

/**
 * Allows users to add text from their editor of choice rather than the terminal
 *
 * @example
 *   openFileInEditor('temp-gh-issue-title.txt', '# Add a pr title msg on the next line')
 */
export function openFileInEditor(fileName: string, msg: string): string {
    try {
        var { name: filePath, removeCallback } = tmp.fileSync({ postfix: `-${fileName}` })

        writeFileSync(filePath, msg)

        const editor =
            process.env.EDITOR ||
            process.env.VISUAL ||
            spawnSync('git', ['config', '--global', 'core.editor']).stdout

        if (editor) {
            execSyncInteractiveStream(`${editor} "${filePath}"`)
        }

        const newFileContents = readFileSync(filePath).toString()

        const commentMark = fileName.endsWith('.md') ? '<!--' : '#'

        removeCallback()

        return cleanFileContents(newFileContents, commentMark)
    } catch (err) {
        logger.error('Could not use your editor to store a custom message\n', err)
    }
}

/**
 * Removes # comments and trims new lines
 * @param {string} commentMark - refers to the comment mark which is different for each file
 */
export function cleanFileContents(fileContents: string, commentMark = '#'): string {
    return fileContents
        .split('\n')
        .filter(line => !line.startsWith(commentMark))
        .join('\n')
        .trim()
}

export function getCurrentFolderName(): string {
    const cwdArr = process
        .cwd()
        .toString()
        .split('/')

    return cwdArr[cwdArr.length - 1]
}

/**
 * Checks to see if the cli arguments are one of the accepted flags
 */
export function userRanValidFlags(commands, options) {
    if (commands) {
        return commands.some(c => {
            return options[c] !== undefined
        })
    }

    return false
}

export async function askUserToPaginate(type: string): Promise<boolean> {
    logger.log('\n')

    const answers = await inquirer.prompt([
        {
            type: 'confirm',
            message: `Would you like to see the next batch of ${type}`,
            name: 'paginate',
        },
    ])

    logger.log('\n')

    return answers.paginate
}
