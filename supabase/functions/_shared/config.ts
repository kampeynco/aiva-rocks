export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function getRequiredEnvVar(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    console.error(`${name} environment variable is not set`);
    throw new Error(`${name} is required`);
  }
  return value;
}