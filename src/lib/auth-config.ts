export function resolveAuthSecret(env: Record<string, string | undefined>): string | undefined {
  return env.NEXTAUTH_SECRET?.trim() || env.AUTH_SECRET?.trim() || undefined;
}
