import { expect, test } from "bun:test"
import { CircuitJsonToKicadPcbConverter } from "lib/pcb/CircuitJsonToKicadPcbConverter"
import { Circuit } from "tscircuit"

/**
 * Issue #585: generated board footprints carried no `(attr ...)` at all, so
 * KiCad's 3D viewer classes every modeled part as a Virtual Model instead of
 * SMD/Through-hole. Each embedded footprint must declare a type inferred
 * from its pads: plated `thru_hole` pads => through_hole, otherwise smd.
 */
test("repro36: exported footprints declare a KiCad type inferred from their pads", async () => {
  const circuit = new Circuit()
  circuit.add(
    <board width="10mm" height="10mm">
      <resistor name="R1" resistance="1k" footprint="0402" pcbX={-2} />
      <pinheader name="J1" pinCount={2} pcbX={2} />
    </board>,
  )

  await circuit.renderUntilSettled()

  const circuitJson = circuit.getCircuitJson()
  const converter = new CircuitJsonToKicadPcbConverter(circuitJson)
  converter.runUntilFinished()
  const output = converter.getOutputString()

  const footprintSections = [
    ...output.matchAll(/\(footprint\b[\s\S]*?\n  \)/g),
  ].map((m) => m[0])
  const byReference = (ref: string) =>
    footprintSections.find((s) => s.includes(`"Reference"`) && s.includes(`"${ref}"`))

  const smdFootprint = byReference("R1")
  const thruHoleFootprint = byReference("J1")
  expect(smdFootprint).toBeDefined()
  expect(thruHoleFootprint).toBeDefined()
  expect(smdFootprint).toContain("(attr smd)")
  expect(thruHoleFootprint).toContain("(attr through_hole)")
})
