// Convert a registration number into a synthetic email so Supabase Auth
// (which requires email) can be driven by reg number + password only.
export function regToEmail(regNumber: string): string {
  const clean = regNumber.trim().toLowerCase().replace(/[^a-z0-9]/g, "-");
  return `${clean}@simba.academy`;
}
