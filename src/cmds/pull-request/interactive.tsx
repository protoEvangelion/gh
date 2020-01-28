import { bindCallback, from } from 'rxjs'
import { map, tap } from 'rxjs/operators'
import * as R from 'ramda'
import * as React from 'react'
import { useState, useContext } from 'react'
import { render, useInput, Box, AppContext, Color } from 'ink'
import { Table } from './table'

export function fetch({ options, path, payload }) {
    const endpoint = R.path(path.split('.'), R.prop('GitHub', options))

    endpoint(payload)
}

export function initInteractive(options) {
    // format payload
    const payload = {
        repo: options.repo,
        sort: options.sort,
        owner: options.user,
        direction: options.direction,
        state: options.state,
    }

    from(options.GitHub.pulls.list(payload))
        .pipe(
            map(({ data }) =>
                data.map(({ number, title, user: { login } }) => ({ number, title, login }))
            ),
            tap(console.log),
            tap(build)
        )
        .subscribe(() => {})

    // hit endpoint - side effect -
    // format data for table
    // set data in table - side effect
    // ---------
}

function build(data) {
    const CustomCell = ({ activeRowIndex }) => ({ children, i }) => {
        return (
            <Color white bold {...(i === activeRowIndex ? { bgHex: '#FFFFFF' } : {})}>
                {children}
            </Color>
        )
    }

    const Basic = () => {
        const [activeRowIndex, setActiveRowIndex] = useState(0)
        const { exit } = useContext(AppContext)

        useInput((input, key) => {
            if (input === 'q') {
                exit()
            }
            if (input === 'c') {
                console.log(data[activeRowIndex])
            }
            if (key.upArrow) {
                setActiveRowIndex(activeRowIndex - 1)
            }
            if (key.downArrow) {
                setActiveRowIndex(activeRowIndex + 1)
            }
        })

        return <Table data={data} cell={CustomCell({ activeRowIndex })} />
    }

    render(<Basic />)
}
