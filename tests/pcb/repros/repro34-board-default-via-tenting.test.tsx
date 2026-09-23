import { expect, test } from "bun:test"
import { CircuitJsonToKicadPcbConverter } from "lib/pcb/CircuitJsonToKicadPcbConverter"

/**
 * pcb_board's default_via_tented_on_top / default_via_tented_on_bottom should
 * become the KiCad setup tenting rule so board-level tenting intent survives
 * the export.
 */
test("repro34: pcb_board default_via_tented_* emit setup tenting", () => {
  const baseBoard = {
    type: "pcb_board",
    pcb_board_id: "b1",
    width: 10,
    height: 10,
    num_layers: 2,
    center: { x: 0, y: 0 },
    thickness: 1.6,
    material: "fr4",
  }

  const both = new CircuitJsonToKicadPcbConverter([
    {
      ...baseBoard,
      default_via_tented_on_top: true,
      default_via_tented_on_bottom: true,
    },
  ] as any)
  both.runUntilFinished()
  expect(both.getOutputString()).toContain("(tenting front back)")

  const topOnly = new CircuitJsonToKicadPcbConverter([
    {
      ...baseBoard,
      default_via_tented_on_top: true,
      default_via_tented_on_bottom: false,
    },
  ] as any)
  topOnly.runUntilFinished()
  expect(topOnly.getOutputString()).toContain("(tenting front)")

  const unset = new CircuitJsonToKicadPcbConverter([{ ...baseBoard }] as any)
  unset.runUntilFinished()
  expect(unset.getOutputString()).not.toContain("tenting")
})
