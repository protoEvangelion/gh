/**
 * © 2013 Liferay, Inc. <https://liferay.com> and Node GH contributors
 * (see file: CONTRIBUTORS)
 * SPDX-License-Identifier: BSD-3-Clause
 */

'use strict'

const { runCmd } = require('./testUtils')

describe('E2E: Repo Module Test', () => {
    it('List Repos `gh re --list`', done => {
        expect(runCmd('bin/gh.js re --list')).toMatchSnapshot()
        done()
    })

    it('Create new repo `gh re --new foo --init`', done => {
        expect(runCmd('bin/gh.js re --new foo --init')).toMatchSnapshot()
        done()
    })

    it('Fork a repo `gh re --fork prettier --user prettier`', done => {
        expect(runCmd('bin/gh.js re --fork prettier --user prettier')).toMatchSnapshot()
        done()
    })

    it('Delete repo `gh re --delete foo`', done => {
        expect(runCmd('bin/gh.js re --delete foo')).toMatchSnapshot()
        done()
    })
})
