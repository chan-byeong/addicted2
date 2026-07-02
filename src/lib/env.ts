export class MissingRequiredEnvError extends Error {
  variableName: string;

  constructor(variableName: string) {
    super(`Missing required environment variable: ${variableName}`);
    this.name = "MissingRequiredEnvError";
    this.variableName = variableName;
  }
}

export function isMissingRequiredEnvError(
  error: unknown,
  variableName?: string,
): error is MissingRequiredEnvError {
  return (
    error instanceof MissingRequiredEnvError &&
    (variableName === undefined || error.variableName === variableName)
  );
}

function readRequiredEnv(value: string | undefined, name: string) {
  if (!value) {
    throw new MissingRequiredEnvError(name);
  }

  return value;
}

export function getPublicEnv() {
  return {
    supabaseUrl: readRequiredEnv(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      "NEXT_PUBLIC_SUPABASE_URL",
    ),
    supabaseAnonKey: readRequiredEnv(
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ),
  };
}

export function getSupabaseServerEnv() {
  return {
    ...getPublicEnv(),
    supabaseServiceRoleKey: readRequiredEnv(
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      "SUPABASE_SERVICE_ROLE_KEY",
    ),
  };
}

export function getServerEnv() {
  return {
    ...getSupabaseServerEnv(),
    archiveWritePassword: readRequiredEnv(
      process.env.ARCHIVE_WRITE_PASSWORD,
      "ARCHIVE_WRITE_PASSWORD",
    ),
  };
}

export function getNexonEnv() {
  return {
    nexonOpenApiKey: readRequiredEnv(
      process.env.NEXON_OPEN_API_KEY,
      "NEXON_OPEN_API_KEY",
    ),
  };
}
