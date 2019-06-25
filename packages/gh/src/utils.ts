/**
 * © 2013 Liferay, Inc. <https://liferay.com> and Node GH contributors
 * (see file: CONTRIBUTORS)
 * SPDX-License-Identifier: BSD-3-Clause
 */

import { isArray, isObject, isPlainObject, map, mapValues } from 'lodash'
import * as nock from 'nock'
import { resolve } from 'path'
import * as zlib from 'zlib'
import * as logger from './logger'

export function getUserRepo({ user, repo }) {
    return logger.colors.green(`${user}/${repo}`)
}

export function getCurrentFolderName(): string {
    const cwdArr = process
        .cwd()
        .toString()
        .split('/')

    return cwdArr[cwdArr.length - 1]
}

export function hasCmdInOptions(commands, options) {
    if (commands) {
        return commands.some(c => {
            return options[c] !== undefined
        })
    }

    return false
}

function capitalizeFirstLetter(str: string): string {
    return `${str.charAt(0).toUpperCase()}${str.slice(1)}`
}

export function prepareTestFixtures(cmdPath: string) {
    const nockBack = nock.back
    let id = 0
    const cmdArr = cmdPath.split('.')

    const formattedCmdName = `${capitalizeFirstLetter(cmdArr[0])}${capitalizeFirstLetter(
        cmdArr[1]
    )}`

    nock.disableNetConnect()
    nockBack.fixtures = resolve(process.cwd(), 'packages/gh/__tests__/nockFixtures')
    nockBack.setMode('record')

    const nockPromise = nockBack(`${formattedCmdName}.json`, {
        before,
        afterRecord,
    })

    return nockPromise

    /* --- Normalization Functions --- */

    function normalize(value, key) {
        if (!value) return value

        if (isPlainObject(value)) {
            return mapValues(value, normalize)
        }

        if (isArray(value) && isPlainObject(value[0])) {
            return map(value, normalize)
        }

        if (key.includes('token')) {
            return '234lkj23l4kj234lkj234lkj234lkj23l4kj234l'
        }

        if (key.includes('_at')) {
            return '2017-10-10T16:00:00Z'
        }

        if (key.includes('_count')) {
            return 42
        }

        if (key.includes('id')) {
            return 1000 + id++
        }

        if (key.includes('node_id')) {
            return 'MDA6RW50aXR5MQ=='
        }

        if (key.includes('url')) {
            return value.replace(/[1-9][0-9]{2,10}/, '000000001')
        }

        return value
    }

    function decodeBuffer(fixture) {
        const response = isArray(fixture.response) ? fixture.response.join('') : fixture.response

        if (!isObject(response)) {
            try {
                // Decode the hex buffer that nock made
                const decoded = Buffer.from(response, 'hex')
                var unzipped = zlib.gunzipSync(decoded).toString('utf-8')
            } catch (err) {
                throw new Error(`Error decoding nock hex:\n${err}`)
            }
        }

        return JSON.parse(unzipped)
    }

    // This only executes when first recording the request, but not on subsequent requests
    function afterRecord(fixtures) {
        const normalizedFixtures = fixtures.map(fixture => {
            const isGzipped = fixture.rawHeaders.includes('gzip')
            let res = fixture.response

            if (fixture.body.note) {
                fixture.body.note = 'Hello from the inside!'
            }

            fixture.path = stripAccessToken(fixture.path)
            fixture.rawHeaders = fixture.rawHeaders.map(header => stripAccessToken(header))

            if (isGzipped) {
                res = decodeBuffer(fixture)
            }

            if (isArray(res)) {
                res = res.slice(0, 3).map(res => {
                    return mapValues(res, normalize)
                })
            } else {
                res = mapValues(res, normalize)
            }

            if (isGzipped) {
                try {
                    // Re-gzip to keep the octokittens happy
                    const stringified = JSON.stringify(res)
                    var zipped = zlib.gzipSync(stringified)
                } catch (err) {
                    throw new Error(`Error re-gzipping nock ==> ${err}`)
                }
            }

            fixture.response = zipped || res

            return fixture
        })

        return normalizedFixtures
    }

    function stripAccessToken(path) {
        return path.replace(/access_token(.*?)(&|$)/gi, '')
    }

    function before(scope) {
        scope.filteringPath = () => stripAccessToken(scope.path)
        scope.filteringRequestBody = (body, aRecordedBody) => {
            if (body.includes('note')) {
                body = JSON.parse(body)
                body.note = aRecordedBody.note

                return JSON.stringify(body)
            }

            return body
        }
    }
}