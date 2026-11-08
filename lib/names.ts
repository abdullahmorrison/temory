/** "Sam Rivera" -> "SR", "Mom" -> "MO". */
export function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? "";
}

/** "Jess", "Jess and Sam", "Jess and 2 others". */
export function listNames([first, ...rest]: string[]) {
  if (rest.length === 0) return first;
  return rest.length === 1 ? `${first} and ${rest[0]}` : `${first} and ${rest.length} others`;
}
