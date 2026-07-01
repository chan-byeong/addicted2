function readRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getPublicEnv() {
  return {
    supabaseUrl: readRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseAnonKey: readRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
}

export function getServerEnv() {
  return {
    ...getPublicEnv(),
    supabaseServiceRoleKey: readRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    archiveWritePassword: readRequiredEnv("ARCHIVE_WRITE_PASSWORD"),
  };
}
