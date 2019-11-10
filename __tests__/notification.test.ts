/**
 * © 2013 Liferay, Inc. <https://liferay.com> and Node GH contributors
 * (see file: README.md)
 * SPDX-License-Identifier: BSD-3-Clause
 */

import { runCmd } from '../src/test-utils'

describe('E2E: Notification Module Test', () => {
    it('List Notifications `gh nt`', done => {
        expect(runCmd('gh nt')).toMatchSnapshot()
        done()
    })
})
