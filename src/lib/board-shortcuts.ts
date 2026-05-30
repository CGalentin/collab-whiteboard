/** Skip board shortcuts when the user is typing in a field or sticky editor. */
export function isEditableShortcutTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return Boolean(
    target.closest("textarea, input, select, [contenteditable='true']"),
  );
}

export function isModShortcut(e: KeyboardEvent): boolean {
  return e.ctrlKey || e.metaKey;
}
