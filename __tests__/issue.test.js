/**
 * © 2013 Liferay, Inc. <https://liferay.com> and Node GH contributors
 * (see file: CONTRIBUTORS)
 * SPDX-License-Identifier: BSD-3-Clause
 */

const { runCmd } = require('./testUtils')

let describeIf

if (process.env.CONTINUOUS_INTEGRATION && process.env.TRAVIS_EVENT_TYPE !== 'push') {
    describeIf = describe.skip
} else {
    describeIf = describe
}

describeIf('E2E: Issues Module Test', () => {
    it('List Issues `gh is`', done => {
        expect(runCmd('bin/gh.js is')).toMatchInlineSnapshot(`
"Listing open issues on protoevangelion/gh
#43 testGo @protoEvangelion (a year ago)

#42 test2 @protoEvangelion (a year ago)

#38 Node GH rocks! @protoEvangelion (a year ago)
"
`)
        done()
    })

    it('Comment on Issues `gh is 1 -c "test"`', done => {
        expect(runCmd(`bin/gh.js is 1 -c "test"`)).toMatchSnapshot()
        done()
    })
})
