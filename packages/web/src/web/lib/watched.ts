/** How long the tab has been open, said the way a person would say it. */
export function watchedLabel(ms: number) {
  const seconds = Math.max(1, Math.round(ms / 1000));
  if (seconds < 90) return `${seconds} SECOND${seconds === 1 ? "" : "S"}`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 90) return `${minutes} MINUTE${minutes === 1 ? "" : "S"}`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const head = `${hours} HOUR${hours === 1 ? "" : "S"}`;
  return rest > 0 ? `${head} ${rest} MIN` : head;
}

/** The same span, compressed for a status rail or a panel corner. */
export function watchedShort(ms: number) {
  const seconds = Math.max(1, Math.round(ms / 1000));
  if (seconds < 90) return `${seconds}S`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 90) return `${minutes}MIN`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest > 0 ? `${hours}H ${rest}MIN` : `${hours}H`;
}
