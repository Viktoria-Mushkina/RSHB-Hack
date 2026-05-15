export function capitalizeProductName(name: string): string {
  if (!name) return name;
  const m = name.match(/^(\s*)(\S)(.*)$/s);
  if (!m) return name;
  const [, lead, letter, tail] = m;
  return lead + letter.toLocaleUpperCase("ru-RU") + tail;
}
