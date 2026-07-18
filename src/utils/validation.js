/** Validates the shared task/mins entry form fields used by LogTab, EditModal, and TodoCompleteModal.
 * Returns an error message string, or null if valid. */
export function validateEntryForm({ task, mins }) {
  if (!task || !String(task).trim()) return 'Task name is required';
  if (mins === '' || mins === null || mins === undefined || Number.isNaN(Number(mins)) || Number(mins) < 1) {
    return 'Duration must be at least 1 minute';
  }
  return null;
}

/** Validates the signup-only fields on AuthPage. Returns an error message string, or null if valid. */
export function validateSignupForm({ name, password, confirm }) {
  if (!name || !name.trim()) return 'Full name is required';
  if (!password || password.length < 8) return 'Password must be at least 8 characters';
  if (password !== confirm) return 'Passwords do not match';
  return null;
}
