import type { SourcePort } from "circuit-json"

type PadNumberSourcePort = Pick<SourcePort, "pin_number">

/**
 * Resolve the KiCad pad number for one pad.
 *
 * Preserve source pin identity — not pad array index — as the KiCad pad
 * number (see issue #212). Walk pcb_port -> source_port.pin_number; fall
 * back to pin-like port_hints, then to the sequential counter.
 *
 * Hint-derived and sequential numbers are only accepted when they are not
 * already claimed by another pad in the same footprint — a shared pad
 * number tells KiCad the pads are the same electrical pin and corrupts the
 * pad-to-net mapping (issue #535). A real source_port.pin_number stays
 * authoritative and always wins.
 */
export function resolvePadNumber({
  sourcePort,
  portHints,
  padNumber,
  usedPadNumbers,
}: {
  sourcePort?: PadNumberSourcePort | null
  portHints?: string[]
  padNumber: number
  usedPadNumbers: Set<string>
}): { resolvedPadNumber: string; nextPadNumber: number } {
  if (sourcePort?.pin_number != null) {
    const resolved = String(sourcePort.pin_number)
    usedPadNumbers.add(resolved)
    return { resolvedPadNumber: resolved, nextPadNumber: padNumber + 1 }
  }

  const pinHint = portHints?.find((h) => /^pin[A-Za-z0-9_]+$/i.test(h))
  const gridHint = portHints?.find((h) => /^[A-Za-z]?\d+[A-Za-z0-9_]*$/.test(h))
  const hintNumbers = [
    ...(pinHint ? [pinHint.replace(/^pin/i, "")] : []),
    ...(gridHint ? [gridHint] : []),
  ]
  for (const hintNumber of hintNumbers) {
    if (!usedPadNumbers.has(hintNumber)) {
      usedPadNumbers.add(hintNumber)
      return { resolvedPadNumber: hintNumber, nextPadNumber: padNumber + 1 }
    }
  }

  let sequential = padNumber
  while (usedPadNumbers.has(String(sequential))) {
    sequential++
  }
  usedPadNumbers.add(String(sequential))
  return {
    resolvedPadNumber: String(sequential),
    nextPadNumber: sequential + 1,
  }
}
