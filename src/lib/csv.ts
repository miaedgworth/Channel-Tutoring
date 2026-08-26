export function toCsv(
  rows: Record<string, string | number>[],
  fallbackHeaders?: string[],
): string {
  const headers = rows.length > 0 ? Object.keys(rows[0]) : (fallbackHeaders ?? []);
  if (headers.length === 0) return "";
  const escape = (value: string | number) => {
    let str = String(value);
    // Prefix a leading =, +, -, or @ with a single quote — Excel/Sheets
    // treat a cell starting with one of these as a formula, so a
    // user-supplied name like "=cmd|'/c calc'!A0" would otherwise execute
    // when an admin opens an exported CSV.
    if (/^[=+\-@]/.test(str)) str = `'${str}`;
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(",")),
  ];
  return lines.join("\n");
}

export function csvResponse(csv: string, filename: string) {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
