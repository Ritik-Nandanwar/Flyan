/** Returns today's UTC calendar date in YYYY-MM-DD form. */
export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Returns the previous UTC calendar date in YYYY-MM-DD form. */
export function yesterday(): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}
