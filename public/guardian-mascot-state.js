/** Map real provider lifecycle events to the four visual states. */
export function guardianMascotState(event, current = 'idle') {
  if (event.type === 'ready' || event.type === 'complete' || event.type === 'done') return 'idle';
  if (event.type === 'request_start' || event.type === 'status' && event.state === 'thinking') return 'thinking';
  if (event.type === 'tool_start' && event.tool === 'search') return 'searching';
  if (event.type === 'tool_end') return 'thinking';
  if (event.type === 'delta' || event.type === 'answer_start') return 'answering';
  return current;
}
