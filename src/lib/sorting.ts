import type { ListenerWithProfile } from "./types";

/**
 * Sort listeners according to the specified rules:
 * 1) Favorite listeners online first
 * 2) Then Active before Inactive
 * 3) Then higher average rating first
 * 4) Then alphabetical username
 */
export function sortListeners(
  listeners: ListenerWithProfile[]
): ListenerWithProfile[] {
  return [...listeners].sort((a, b) => {
    // 1. Favorites online first
    const aFavActive = a.isFavorite && a.status === "active" ? 1 : 0;
    const bFavActive = b.isFavorite && b.status === "active" ? 1 : 0;
    if (aFavActive !== bFavActive) {
      return bFavActive - aFavActive;
    }

    // 2. Active before Inactive
    if (a.status !== b.status) {
      return a.status === "active" ? -1 : 1;
    }

    // 3. Higher rating first
    if (a.rating_avg !== b.rating_avg) {
      return b.rating_avg - a.rating_avg;
    }

    // 4. Alphabetical username
    return a.username.localeCompare(b.username);
  });
}

/**
 * Check if a listener should show the deny limit warning
 */
export function getDenyWarning(sessionDenies: number): string | null {
  if (sessionDenies === 2) {
    return "One deny left this session.";
  }
  return null;
}

/**
 * Check if deny button should be disabled
 */
export function isDenyDisabled(sessionDenies: number): boolean {
  return sessionDenies >= 3;
}
