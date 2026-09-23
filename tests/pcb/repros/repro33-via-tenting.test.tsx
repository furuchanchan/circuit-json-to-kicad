import { expect, test } from "bun:test"
import { CircuitJsonToKicadPcbConverter } from "lib/pcb/CircuitJsonToKicadPcbConverter"

/**
 * pcb_via tenting fields should be emitted in the KiCad output.
 *
 * circuit-json exposes `is_tented` (both sides) plus the newer per-side
 * `tented_on_top` / `tented_on_bottom`. None of them were mapped onto the
 * exported via, so tenting was silently dropped in KiCad projects.
 */
test("repro33: pcb_via tenting fields emit a KiCad tenting token", () => {
  const circuitJson = [
    {
      type: "pcb_via",
      x: 1,
      y: 2,
      outer_diameter: 0.6,
      hole_diameter: 0.3,
      from_layer: "top",
      to_layer: "bottom",
      tented_on_top: true,
      tented_on_bottom: true,
    },
    {
      type: "pcb_via",
      x: 3,
      y: 2,
      outer_diameter: 0.6,
      hole_diameter: 0.3,
      from_layer: "top",
      to_layer: "bottom",
      tented_on_top: true,
      tented_on_bottom: false,
    },
    {
      type: "pcb_via",
      x: 5,
      y: 2,
      outer_diameter: 0.6,
      hole_diameter: 0.3,
      from_layer: "top",
      to_layer: "bottom",
      is_tented: true,
    },
    {
      type: "pcb_via",
      x: 7,
      y: 2,
      outer_diameter: 0.6,
      hole_diameter: 0.3,
      from_layer: "top",
      to_layer: "bottom",
    },
  ] as any

  const converter = new CircuitJsonToKicadPcbConverter(circuitJson)
  converter.runUntilFinished()
  const output = converter.getOutputString()

  const vias = [...output.matchAll(/\(via\b[\s\S]*?\n  \)/g)].map((m) => m[0])
  expect(vias).toHaveLength(4)

  expect(vias[0]).toContain("(tenting front back)")
  expect(vias[1]).toContain("(tenting front)")
  expect(vias[2]).toContain("(tenting front back)")
  expect(vias[3]).not.toContain("tenting")
})
