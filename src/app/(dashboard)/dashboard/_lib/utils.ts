export const toNumber = (value: string | number | null | undefined) => Number(value || 0);

export const normalizeRoles = (roles: unknown): string[] => {
  const list = Array.isArray(roles) ? roles : [];
  return list
    .flatMap((role) => {
      const str = String(role ?? '');
      if (str.includes('[') && str.includes(']')) {
        try {
          const parsed = JSON.parse(str);
          if (Array.isArray(parsed)) return parsed;
        } catch {
          // ignore malformed role payload
        }
      }
      return [str];
    })
    .map((r) =>
      String(r)
        .replace(/[[\]"]/g, '')
        .trim()
        .toLowerCase()
    )
    .filter(Boolean);
};
