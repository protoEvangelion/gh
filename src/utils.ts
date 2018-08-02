export function trimLeadingSpaces(str): string {
  return str.replace(/^[ ]+/gm, '').trim()
}

/**
 * Compress query by stripping duplicate whitespace, and whitespace adjacent to
 * brackets, braces, parentheses, colons, and commas.
 * https://github.com/jeromecovington/graphql-compress/blob/master/index.js
 *
 */
export function compressQuery(text: string): string {
  const query = text.replace(/\s+/g, ' ')
  const compressedQuery = query.replace(/\s*(\[|\]|\{|\}|\(|\)|:|\,)\s*/g, '$1')

  return trimLeadingSpaces(compressedQuery)
}
