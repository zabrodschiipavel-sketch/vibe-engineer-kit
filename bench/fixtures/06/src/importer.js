import { parseCsvLine } from './csv.js';

export function parseRow(line) {
  const fields = parseCsvLine(line);
  return { name: fields[0], email: fields[1] };
}
