/**
 * Returns the change-dir timestamp prefix in UTC: YYYY-MM-DD-HHMMSS.
 */
export function changeDirStamp(now: Date = new Date()): string {
  const iso = now.toISOString();
  // 2026-05-14T09:30:15.123Z → 2026-05-14 + 093015
  const date = iso.slice(0, 10);
  const time = iso.slice(11, 19).replace(/:/g, '');
  return `${date}-${time}`;
}

export function makeChangeDirName(feature: string, now: Date = new Date()): string {
  return `${changeDirStamp(now)}-${feature}`;
}
