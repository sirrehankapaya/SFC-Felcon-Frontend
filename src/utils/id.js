// tiny id helper so we don't need to pull in a uuid dependency for a project this size
const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';

export function makeId(prefix = '') {
  let out = '';
  for (let i = 0; i < 8; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return prefix ? `${prefix}_${out}` : out;
}

export function gatePassCode() {
  // 6 digit numeric code, easier for a guard to type on a shared tablet than an alphanumeric string
  return String(Math.floor(100000 + Math.random() * 900000));
}
