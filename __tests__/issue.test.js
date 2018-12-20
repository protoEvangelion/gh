/**
 * © 2013 Liferay, Inc. <https://liferay.com> and Node GH contributors
 * (see file: CONTRIBUTORS)
 * SPDX-License-Identifier: BSD-3-Clause
 */

const { exec, execSync } = require('child_process')

describe('E2E: Issues Module Test', () => {
    it('List Issues `gh is`', done => {
        const result = exec('bin/gh.js is', { cwd: process.cwd() }, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error-------: ${error}`)
                expect(error).toBe(1)
                return
            }
            expect(stderr).toBe(2)
            expect(stdout).toBe(3)
            console.log(`stdout==========: ${stdout}`)
            console.log(`stderr!!!!!!!!!!: ${stderr}`)
            done()
        })

        // expect(result.toString()).toMatchSnapshot()
        // done()
    })

    it.skip('List Issues `gh is -N -t "Node GH rocks!" -L bug,question,test`', done => {
        const result = execSync(
            `bin/gh.js is -N -t "test ${new Date().getMilliseconds()}" -L bug,question,test`,
            {
                cwd: process.cwd(),
            }
        )

        expect(result.toString()).toMatchSnapshot()

        done()
    })
})
