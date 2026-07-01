export function verifyWritePassword(
  input: string | undefined,
  expected: string,
) {
  if (!input || !expected) {
    return false;
  }

  return input === expected;
}
