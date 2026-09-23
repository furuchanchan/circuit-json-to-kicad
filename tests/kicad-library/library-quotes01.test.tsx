import { expect, test } from "bun:test"
import { Circuit } from "tscircuit"
import { CircuitJsonToKicadLibraryConverter } from "lib"
import { generateFpLibTable } from "lib/kicad-library/kicad-library-converter-utils/generateFpLibTable"
import { generateSymLibTable } from "lib/kicad-library/kicad-library-converter-utils/generateSymLibTable"

/**
 * Issue #533: library table generators interpolated the library name into
 * quoted S-expression fields without escaping. A name containing a double
 * quote produced malformed rows like (name "Lab "A"").
 */
test("library table strings escape quotes in library names", async () => {
  const circuit = new Circuit()
  circuit.add(
    <board width={20} height={20}>
      <resistor name="R1" resistance="1k" footprint="0402" />
    </board>,
  )
  await circuit.renderUntilSettled()
  const converter = new CircuitJsonToKicadLibraryConverter(
    circuit.getCircuitJson(),
    {
      libraryName: 'Lab "A"',
      footprintLibraryName: 'Lab "A"',
    },
  )
  converter.runUntilFinished()
  const output = converter.getOutput()
  const quotedName = String.raw`(name "Lab \"A\"")`
  expect(output.fpLibTableString).toContain(quotedName)
  expect(output.symLibTableString).toContain(quotedName)
  const quotedUri = String.raw`/Lab \"A\"`
  expect(output.fpLibTableString).toContain(quotedUri)
  expect(output.symLibTableString).toContain(quotedUri)

  // The standalone helpers take the same name path (#533).
  const helperParams = {
    kicadLibraryName: 'Lab "A"',
    includeUser: true,
    includeBuiltin: false,
  }
  expect(generateFpLibTable(helperParams)).toContain(quotedName)
  expect(generateSymLibTable(helperParams)).toContain(quotedName)
})
