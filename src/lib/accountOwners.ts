export function splitOwnerNames(ownerName: string | null | undefined): string[] {
  return (ownerName ?? "")
    .split(",")
    .map((name) => name.trim().toLowerCase())
    .filter(Boolean);
}

export function accountHasOwner(ownerName: string | null | undefined, profileName: string): boolean {
  const normalizedProfile = profileName.trim().toLowerCase();
  if (!normalizedProfile) return false;
  return splitOwnerNames(ownerName).includes(normalizedProfile);
}

export function formatOwnerGroup(ownerName: string | null | undefined): string {
  const owners = splitOwnerNames(ownerName);
  if (owners.length === 0) return "Unassigned";
  return ownerName?.trim() || "Unassigned";
}
