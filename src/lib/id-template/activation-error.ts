export function classifyActivationDatabaseError(error: unknown): {
  code: string;
  status: number;
  message: string;
} {
  const code = error && typeof error === "object" && "code" in error &&
    typeof error.code === "string" ? error.code : "UNKNOWN";
  switch (code) {
    case "P2034":
      return { code, status: 409,
        message: "Another template change happened concurrently. Reload the Designer and try again." };
    case "P2028":
      return { code, status: 503,
        message: "Template activation timed out. The saved design was not changed. Try again, or ask support to inspect the transaction timeout." };
    case "P2010":
      return { code, status: 503,
        message: "The database could not complete the activation lock. The saved design was not changed. Ask support to check database permissions and the activation query." };
    case "P2003":
      return { code, status: 409,
        message: "A template or administrator reference changed. Reload the Designer before retrying." };
    default:
      return { code: "UNKNOWN", status: 500,
        message: "Template activation failed. The saved design was not changed. Ask support to check the activation log category." };
  }
}
