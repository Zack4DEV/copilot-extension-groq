// small utility used by session function (uid)
export function uid(prefix = '') {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2,8)}`;
}