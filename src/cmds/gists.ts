/**
 * © 2013 Liferay, Inc. <https://liferay.com> and Node GH contributors
 * (see file: README.md)
 * SPDX-License-Identifier: BSD-3-Clause
 */

// -- Requires -------------------------------------------------------------------------------------

import * as inquirer from 'inquirer'
import { openUrl, userRanValidFlags } from '../utils'
import * as base from '../base'
import { getGitHubInstance } from '../github'
import { afterHooks, beforeHooks } from '../hooks'
import * as logger from '../logger'

const config = base.getConfig()

// -- Constructor ----------------------------------------------------------------------------------

export default function Gists() {}

// -- Constants ------------------------------------------------------------------------------------

Gists.DETAILS = {
    alias: 'gi',
    description: 'Provides a set of util commands to work with Gists.',
    commands: ['browser', 'delete', 'fork', 'list', 'new'],
    options: {
        browser: Boolean,
        content: String,
        date: String,
        delete: [String, Array],
        description: String,
        fork: String,
        id: String,
        list: Boolean,
        new: String,
        private: Boolean,
        user: String,
    },
    shorthands: {
        B: ['--browser'],
        c: ['--content'],
        D: ['--delete'],
        d: ['--description'],
        f: ['--fork'],
        i: ['--id'],
        l: ['--list'],
        N: ['--new'],
        p: ['--private'],
        u: ['--user'],
    },
}

// -- Commands -------------------------------------------------------------------------------------

Gists.prototype.run = async function(options, done) {
    const instance = this

    instance.config = config
    instance.GitHub = await getGitHubInstance()

    if (!userRanValidFlags(Gists.DETAILS.commands, options)) {
        options.list = true
    }

    if (options.browser) {
        instance.browser(options.id || options.loggedUser)
    }

    if (options.delete) {
        options.delete

        const answers = await inquirer.prompt([
            {
                type: 'input',
                message: 'Are you sure? This action CANNOT be undone. [y/N]',
                name: 'confirmation',
            },
        ])

        if (
            answers.confirmation.toLowerCase() === 'n' ||
            answers.confirmation.toLowerCase() === ''
        ) {
            console.log('Not deleted.')
            return
        }

        for (const gist_id of options.delete) {
            logger.log(`Deleting gist ${logger.colors.green(`${options.loggedUser}/${gist_id}`)}`)

            await beforeHooks('gists.delete', { options })

            await _deleteHandler(gist_id, instance)

            await afterHooks('gists.delete', { options })
        }
    }

    if (options.fork) {
        await beforeHooks('gists.fork', { options })

        logger.log(`Forking gist on ${logger.colors.green(options.loggedUser)}`)

        try {
            var { data } = await instance.fork(options.fork)
        } catch (err) {
            throw new Error(`Cannot fork gist.\n${err}`)
        }

        logger.log(data.html_url)

        await afterHooks('gists.fork', { options })
    }

    if (options.list) {
        logger.log(`Listing gists for ${logger.colors.green(options.user)}`)

        try {
            var data = await instance.list(options.user)
        } catch (err) {
            throw new Error(`Can't list gists for ${options.user}.`)
        }

        instance.listCallback_(data)
    }

    if (options.new) {
        const privacy = options.private ? 'private' : 'public'

        await beforeHooks('gists.new', { options })

        logger.log(
            `Creating ${logger.colors.magenta(privacy)} gist on ${logger.colors.green(
                options.loggedUser
            )}`
        )

        try {
            var { data } = await instance.new(options.new, options.content)
        } catch (err) {
            throw new Error(`Can't create gist.\n${err}`)
        }

        if (data) {
            options.id = data.id
            logger.log(data.html_url)
        }

        await afterHooks('gists.new', { options })
    }

    done && done()
}

Gists.prototype.browser = function(gist) {
    openUrl(config.github_gist_host + gist)
}

Gists.prototype.delete = function(id) {
    const instance = this
    const payload = {
        gist_id: id,
    }

    return instance.GitHub.gists.delete(payload)
}

Gists.prototype.fork = function(id) {
    const instance = this

    const payload = {
        gist_id: id,
    }

    return instance.GitHub.gists.fork(payload)
}

Gists.prototype.list = async function(user) {
    const instance = this
    const payload = {
        username: user,
    }

    return instance.GitHub.paginate(instance.GitHub.gists.listPublicForUser.endpoint(payload))
}

Gists.prototype.listCallback_ = function(gists) {
    if (gists && gists.length > 0) {
        gists.forEach(gist => {
            const duration = logger.getDuration(gist.updated_at, this.options.date)

            logger.log(`${logger.colors.yellow(`${gist.owner.login}/${gist.id}`)} ${duration}`)

            if (gist.description) {
                logger.log(gist.description)
            }

            logger.log(`${logger.colors.blue(gist.html_url)}\n`)
        })
    }
}

Gists.prototype.new = function(options, name, content) {
    const instance = this

    let file = {}

    options.description = options.description || ''

    file[name] = {
        content,
    }

    const payload = {
        description: options.description,
        files: file,
        public: !options.private,
    }

    return instance.GitHub.gists.create(payload)
}

async function _deleteHandler(gist_id, instance) {
    try {
        var { status } = await instance.delete(gist_id)
    } catch (err) {
        throw new Error(`Can't delete gist: ${gist_id}.`)
    }

    status === 204 && logger.log(`Successfully deleted gist: ${gist_id}`)
}
