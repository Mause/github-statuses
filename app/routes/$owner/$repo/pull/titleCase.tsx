export function titleCase(conclusion: string) {
  const c = conclusion.toLowerCase().split("_").join(" ");
  return c.slice(0, 1).toUpperCase() + c.slice(1);
}
