export const TOOL_SERVER_PANEL_WIDTH = 200
export const LLM_PANEL_WIDTH = 260
export const INSPECTOR_PANEL_INSET = 12
export const STACK_PANEL_GAP = 16

export function stackShiftForPanel(panelWidth: number) {
  return (panelWidth + INSPECTOR_PANEL_INSET + STACK_PANEL_GAP) / 2
}
