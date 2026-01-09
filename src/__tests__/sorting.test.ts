import { sortListeners, getDenyWarning, isDenyDisabled } from "@/lib/sorting";
import type { ListenerWithProfile } from "@/lib/types";

describe("sortListeners", () => {
  const createListener = (
    overrides: Partial<ListenerWithProfile>
  ): ListenerWithProfile => ({
    id: "test-id",
    username: "testuser",
    role: "listener",
    language_code: "en",
    created_at: new Date().toISOString(),
    banned: false,
    reports_count: 0,
    rating_avg: 3.0,
    rating_count: 10,
    status: "inactive",
    isFavorite: false,
    ...overrides,
  });

  it("should sort favorite active listeners first", () => {
    const listeners: ListenerWithProfile[] = [
      createListener({
        id: "1",
        username: "normal",
        status: "active",
        isFavorite: false,
      }),
      createListener({
        id: "2",
        username: "favorite",
        status: "active",
        isFavorite: true,
      }),
    ];

    const sorted = sortListeners(listeners);
    expect(sorted[0].username).toBe("favorite");
    expect(sorted[1].username).toBe("normal");
  });

  it("should sort active listeners before inactive", () => {
    const listeners: ListenerWithProfile[] = [
      createListener({ id: "1", username: "inactive", status: "inactive" }),
      createListener({ id: "2", username: "active", status: "active" }),
    ];

    const sorted = sortListeners(listeners);
    expect(sorted[0].username).toBe("active");
    expect(sorted[1].username).toBe("inactive");
  });

  it("should sort by rating when status is the same", () => {
    const listeners: ListenerWithProfile[] = [
      createListener({
        id: "1",
        username: "low",
        status: "active",
        rating_avg: 2.0,
      }),
      createListener({
        id: "2",
        username: "high",
        status: "active",
        rating_avg: 4.5,
      }),
    ];

    const sorted = sortListeners(listeners);
    expect(sorted[0].username).toBe("high");
    expect(sorted[1].username).toBe("low");
  });

  it("should sort alphabetically when rating is the same", () => {
    const listeners: ListenerWithProfile[] = [
      createListener({
        id: "1",
        username: "zebra",
        status: "active",
        rating_avg: 4.0,
      }),
      createListener({
        id: "2",
        username: "alpha",
        status: "active",
        rating_avg: 4.0,
      }),
    ];

    const sorted = sortListeners(listeners);
    expect(sorted[0].username).toBe("alpha");
    expect(sorted[1].username).toBe("zebra");
  });

  it("should apply all sorting rules correctly", () => {
    const listeners: ListenerWithProfile[] = [
      createListener({
        id: "1",
        username: "inactive_low",
        status: "inactive",
        rating_avg: 2.0,
        isFavorite: false,
      }),
      createListener({
        id: "2",
        username: "active_fav",
        status: "active",
        rating_avg: 3.0,
        isFavorite: true,
      }),
      createListener({
        id: "3",
        username: "active_high",
        status: "active",
        rating_avg: 5.0,
        isFavorite: false,
      }),
      createListener({
        id: "4",
        username: "active_medium",
        status: "active",
        rating_avg: 4.0,
        isFavorite: false,
      }),
    ];

    const sorted = sortListeners(listeners);
    expect(sorted[0].username).toBe("active_fav"); // Favorite + active first
    expect(sorted[1].username).toBe("active_high"); // Then by rating
    expect(sorted[2].username).toBe("active_medium");
    expect(sorted[3].username).toBe("inactive_low"); // Inactive last
  });
});

describe("getDenyWarning", () => {
  it("should return warning after second deny", () => {
    expect(getDenyWarning(2)).toBe("One deny left this session.");
  });

  it("should return null for less than 2 denies", () => {
    expect(getDenyWarning(0)).toBeNull();
    expect(getDenyWarning(1)).toBeNull();
  });

  it("should return null for more than 2 denies", () => {
    expect(getDenyWarning(3)).toBeNull();
    expect(getDenyWarning(4)).toBeNull();
  });
});

describe("isDenyDisabled", () => {
  it("should return false for less than 3 denies", () => {
    expect(isDenyDisabled(0)).toBe(false);
    expect(isDenyDisabled(1)).toBe(false);
    expect(isDenyDisabled(2)).toBe(false);
  });

  it("should return true for 3 or more denies", () => {
    expect(isDenyDisabled(3)).toBe(true);
    expect(isDenyDisabled(4)).toBe(true);
    expect(isDenyDisabled(5)).toBe(true);
  });
});
