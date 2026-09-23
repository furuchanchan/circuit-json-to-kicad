import { expect, test } from "bun:test"
import { Circuit } from "tscircuit"
import { CircuitJsonToKicadPcbConverter } from "lib"

/**
 * Issue #535: a pad whose source_port has no real pin_number fell back to a
 * pin-like port_hint (e.g. the literal hint "1" that tscircuit
 * auto-generates) without checking that number was not already claimed by
 * another pad in the same footprint. Two physically unrelated pads ended
 * up with the same KiCad pad number, which KiCad reads as "same electrical
 * pin" — corrupting ratsnest, pick-and-place, and DRC.
 */
test("pads with colliding hint-derived numbers get distinct KiCad pad numbers", async () => {
  const circuit = new Circuit()
  circuit.add(
    <board width="20mm" height="10mm" routingDisabled>
      <chip
        name="U1"
        pcbX={0}
        pcbY={0}
        footprint={
          <footprint>
            <smtpad
              portHints={["pin1"]}
              pcbX="-1mm"
              pcbY="0mm"
              width="0.3mm"
              height="0.3mm"
              shape="rect"
            />
            <smtpad
              portHints={["1"]}
              pcbX="1mm"
              pcbY="0mm"
              width="0.3mm"
              height="0.3mm"
              shape="rect"
            />
          </footprint>
        }
      />
    </board>,
  )

  await circuit.renderUntilSettled()
  const converter = new CircuitJsonToKicadPcbConverter(circuit.getCircuitJson())
  converter.runUntilFinished()
  const output = converter.getOutputString()

  const padNumbers = [...output.matchAll(/\(pad "([^"]+)" smd rect/g)].map(
    (m) => m[1],
  )
  expect(padNumbers).toHaveLength(2)
  expect(new Set(padNumbers).size).toBe(2)
})
