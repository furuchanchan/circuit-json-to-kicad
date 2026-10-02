import { expect, test } from "bun:test"
import { Circuit } from "tscircuit"
import { CircuitJsonToKicadSchConverter } from "lib/schematic/CircuitJsonToKicadSchConverter"
import { parseKicadSch } from "kicadts"

// #595: power nets used to export as non-power `Custom:rail_*` lib symbols
// with the net name as the Reference designator — KiCad treated every rail
// as an ordinary component (annotation errors) and split the net per
// instance. They must export as `(power)` symbols named after the net with
// a power_in pin carrying the net name, so rails join into one net.
test("repro24: power/ground net labels export as KiCad power symbols", async () => {
  const circuit = new Circuit()

  circuit.add(
    <board width="20mm" height="20mm">
      <capacitor
        name="C1"
        polarized
        capacitance="220uF"
        footprint="electrolytic_d10mm_p5mm"
        pcbX={0}
        pcbY={0}
      />
      <capacitor
        name="C2"
        capacitance="100nF"
        footprint="0603"
        pcbX={8}
        pcbY={0}
      />
      <capacitor
        name="C3"
        capacitance="100nF"
        footprint="0603"
        pcbX={-8}
        pcbY={0}
      />
      <trace from=".C1 > .pin1" to="net.V24" />
      <trace from=".C1 > .pin2" to="net.GND" />
      <trace from=".C2 > .pin1" to="net.V24" />
      <trace from=".C2 > .pin2" to="net.GND" />
      <trace from=".C3 > .pin1" to="net.V24" />
      <trace from=".C3 > .pin2" to="net.GND" />
    </board>,
  )

  await circuit.renderUntilSettled()

  const converter = new CircuitJsonToKicadSchConverter(circuit.getCircuitJson())
  converter.runUntilFinished()
  const output = converter.getOutputString()

  // One `(power)` lib symbol per net — never a `Custom:rail_*` symbol.
  expect(output).not.toContain("Custom:rail")
  const sch = parseKicadSch(output)

  const libSymbols = sch.libSymbols?.symbols ?? []
  const powerLibIds = libSymbols
    .filter((s) => s._sxPower !== undefined)
    .map((s) => s.libraryId)
    .sort()
  expect(powerLibIds).toEqual(["power:GND", "power:V24"])

  // The power pin must be a power_in pin NAMED AFTER THE NET — that name is
  // what KiCad uses to join every rail instance into one global net.
  const gndLib = libSymbols.find((s) => s.libraryId === "power:GND")!
  const gndPin = gndLib.subSymbols.flatMap((sub) => sub.pins).find(() => true)!
  expect(gndPin.pinElectricalType).toBe("power_in")
  expect(gndPin._sxName?.value).toBe("GND")

  // In-bom/on_board off at lib level, like KiCad's own power lib.
  expect(gndLib.inBom).toBe(false)
  expect(gndLib.onBoard).toBe(false)

  // Rail instances: power lib_id, #PWRnn references, Value = net name —
  // never the net name as a Reference designator.
  const railInstances = (sch.symbols ?? []).filter((s) =>
    s.libraryId?.startsWith("power:"),
  )
  expect(railInstances.length).toBeGreaterThan(0)
  const references = railInstances
    .map((s) => s.properties.find((p) => p.key === "Reference")?.value ?? "")
    .sort()
  for (const ref of references) {
    expect(ref).toMatch(/^#PWR\d+$/)
  }
  expect(new Set(references).size).toBe(references.length)
  for (const instance of railInstances) {
    const net = instance.libraryId!.slice("power:".length)
    expect(instance.properties.find((p) => p.key === "Value")?.value).toBe(net)
  }

  await Bun.write(
    "./debug-output/repro24-power-net-rail-symbols.kicad_sch",
    output,
  )
})
