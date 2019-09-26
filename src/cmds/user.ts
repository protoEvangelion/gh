/**
 * © 2013 Liferay, Inc. <https://liferay.com> and Node GH contributors
 * (see file: README.md)
 * SPDX-License-Identifier: BSD-3-Clause
 */

// -- Requires -------------------------------------------------------------------------------------

import * as configs from '../configs'
import { getGitHubInstance, tokenExists } from '../github'
import * as logger from '../logger'
import { userRanValidFlags } from '../utils'

const testing = process.env.NODE_ENV === 'testing'

// -- Constructor ----------------------------------------------------------------------------------

export default function User() {}

// -- Constants ------------------------------------------------------------------------------------

User.DETAILS = {
    alias: 'us',
    description: 'Provides the ability to login and logout if needed.',
    commands: ['login', 'logout', 'whoami'],
    options: {
        login: Boolean,
        logout: Boolean,
        whoami: Boolean,
    },
    shorthands: {
        l: ['--login'],
        L: ['--logout'],
        w: ['--whoami'],
    },
}

// -- Commands -------------------------------------------------------------------------------------

User.prototype.run = async function(options, done) {
    let login = options.login

    if (!userRanValidFlags(User.DETAILS.commands, options)) {
        login = true
    }

    if (login) {
        if (tokenExists()) {
            logger.log(`You're logged in as ${logger.colors.green(options.user)}`)
        } else {
            await getGitHubInstance()

            done && done()
        }
    }

    if (options.logout) {
        logger.log(`Logging out of user ${logger.colors.green(options.user)}`)

        !testing && User.logout()
    }

    if (options.whoami) {
        logger.log(options.user)
    }
}

// -- Static ---------------------------------------------------------------------------------------

User.logout = function() {
    configs.removeGlobalConfig('github_user')
    configs.removeGlobalConfig('github_token')
}
