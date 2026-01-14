export const addEnvPrefix = (path) => {
  const base = import.meta?.env?.BASE_URL || "/";
  return `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};
// result: "/" or "/guybriggs/"