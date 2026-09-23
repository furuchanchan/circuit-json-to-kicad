import type { PcbPlatedHole } from "circuit-json"
import type { FootprintPad } from "kicadts"
import type { ConverterContext, PcbNetInfo } from "../../../types"
import { createThruHolePadFromCircuitJson } from "../utils/CreateThruHolePadFromCircuitJson"
import { resolvePadNumber } from "./resolvePadNumber"

export function convertPlatedHoles(
  {
    platedHoles,
    componentCenter,
    componentRotation,
    componentId,
    startPadNumber,
    usedPadNumbers,
    getNetInfo,
  }: {
    platedHoles: PcbPlatedHole[]
    componentCenter: { x: number; y: number }
    componentRotation: number
    componentId: string
    startPadNumber: number
    usedPadNumbers: Set<string>
    getNetInfo: (pcbPortId?: string) => PcbNetInfo | undefined
  },
  ctx: ConverterContext,
): { pads: FootprintPad[]; nextPadNumber: number } {
  const pads: FootprintPad[] = []
  let padNumber = startPadNumber

  for (const platedHole of platedHoles) {
    const netInfo = getNetInfo(platedHole.pcb_port_id)

    const pcbPort = platedHole.pcb_port_id
      ? ctx.db.pcb_port?.get(platedHole.pcb_port_id)
      : undefined
    const sourcePort = pcbPort?.source_port_id
      ? ctx.db.source_port?.get(pcbPort.source_port_id)
      : undefined
    const resolved = resolvePadNumber({
      sourcePort,
      portHints: platedHole.port_hints,
      padNumber,
      usedPadNumbers,
    })

    const pad = createThruHolePadFromCircuitJson({
      platedHole,
      componentCenter,
      padNumber: resolved.resolvedPadNumber,
      componentRotation,
      netInfo,
      componentId,
    })
    if (pad) {
      pads.push(pad)
      padNumber = resolved.nextPadNumber
    }
  }

  return { pads, nextPadNumber: padNumber }
}
