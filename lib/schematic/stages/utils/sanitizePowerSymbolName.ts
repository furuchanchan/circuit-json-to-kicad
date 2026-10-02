/**
 * KiCad symbol names cannot contain whitespace, quotes or parens; net names
 * like "+3V3" or "V OUT" are legal in circuit-json, so fold them to '_'.
 */
export function sanitizePowerSymbolName(netName: string): string {
  const cleaned = netName.replace(/[\s"()]+/g, "_").replace(/^_+|_+$/g, "")
  return cleaned || "PWR"
}
