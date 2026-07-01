function readRequiredEnv(value: string | undefined, name: string) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
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
