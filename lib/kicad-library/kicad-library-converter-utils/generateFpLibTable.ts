import { escapeSExprString } from "./escapeSExprString"

/**
 * Generate fp-lib-table content for KiCad footprint library.
 */
export function generateFpLibTable(params: {
  kicadLibraryName: string
  includeUser: boolean
  includeBuiltin: boolean
}): string {
  const { kicadLibraryName, includeUser, includeBuiltin } = params
  const escapedName = escapeSExprString(kicadLibraryName)
  let content = "(fp_lib_table\n"
  if (includeUser) {
    content += `  (lib (name "${escapedName}")(type "KiCad")(uri "\${KIPRJMOD}/footprints/${escapedName}.pretty")(options "")(descr ""))\n`
  }
  if (includeBuiltin) {
    content += `  (lib (name "tscircuit_builtin")(type "KiCad")(uri "\${KIPRJMOD}/footprints/tscircuit_builtin.pretty")(options "")(descr ""))\n`
  }
  content += ")\n"
  return content
}
