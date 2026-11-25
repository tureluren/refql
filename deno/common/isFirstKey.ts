const isFirstKey = <T extends Record<string, unknown>>(standardProps: { col: any; as: any}[]) => (obj: T, key: keyof T & string): boolean => {
  const nonNullKeys = Object.keys (obj).filter (k => {
    const standardProp = standardProps.find (sp => sp.as === k);
    return obj[k as keyof T] !== undefined && standardProp != null;
  // Same order as the SET clause of an update (`localeCompare`, see
  // RQLTag/UpdateRQLTag): with the default code-unit sort, `undoReason` came
  // before `undoneAt` here but after it there, so the comma went to the
  // wrong field (`set, undone_at = $1 undo_reason = $2`).
  }).sort ((a, b) => a.localeCompare (b));
  return key === nonNullKeys[0];
};

export default isFirstKey;