export function getBotToken(envVar: string): string {
  const token = process.env[envVar];

  if (!token) {
    throw new Error(`${envVar} is not set`);
  }

  return token;
}
