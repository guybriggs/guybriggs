export function FishingRodComponent({ used = false, wage = 0, location = { x: 0, y: 0 }, assigned = false } = {}) {
  return { used, wage, location, assigned };
}
