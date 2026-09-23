/**
 * Escape a value for interpolation inside a quoted S-expression string,
 * matching kicadts' quoteSExprString escaping (#533).
 */
export function escapeSExprString(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t")
}
