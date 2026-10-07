export function safeCsvCell(value: string): string {
  // Quoting alone does not stop spreadsheet applications from evaluating formulas.
  const guarded = /^[\s\u0000-\u001f]*[=+\-@]/u.test(value) || /^[\t\r\n]/u.test(value)
    ? `'${value}`
    : value;
  return `"${guarded.replace(/"/g, '""')}"`;
}
