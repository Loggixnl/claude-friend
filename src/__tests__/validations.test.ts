import {
  signupSchema,
  loginSchema,
  callRequestSchema,
  ratingSchema,
  misconductReportSchema,
} from "@/lib/validations";

describe("signupSchema", () => {
  const validData = {
    username: "testuser",
    email: "test@example.com",
    password: "Password123",
    confirmPassword: "Password123",
    role: "talker" as const,
    languageCode: "en",
  };

  it("should validate correct signup data", () => {
    const result = signupSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should reject short username", () => {
    const result = signupSchema.safeParse({ ...validData, username: "ab" });
    expect(result.success).toBe(false);
  });

  it("should reject username with special characters", () => {
    const result = signupSchema.safeParse({
      ...validData,
      username: "test@user",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid email", () => {
    const result = signupSchema.safeParse({
      ...validData,
      email: "invalid-email",
    });
    expect(result.success).toBe(false);
  });

  it("should reject weak password", () => {
    const result = signupSchema.safeParse({
      ...validData,
      password: "weak",
      confirmPassword: "weak",
    });
    expect(result.success).toBe(false);
  });

  it("should reject password without uppercase", () => {
    const result = signupSchema.safeParse({
      ...validData,
      password: "password123",
      confirmPassword: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("should reject password without number", () => {
    const result = signupSchema.safeParse({
      ...validData,
      password: "Password",
      confirmPassword: "Password",
    });
    expect(result.success).toBe(false);
  });

  it("should reject mismatched passwords", () => {
    const result = signupSchema.safeParse({
      ...validData,
      confirmPassword: "Different123",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid role", () => {
    const result = signupSchema.safeParse({
      ...validData,
      role: "admin",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("should validate correct login data", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid email", () => {
    const result = loginSchema.safeParse({
      email: "invalid",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("should reject empty password", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("callRequestSchema", () => {
  it("should validate correct call request data", () => {
    const result = callRequestSchema.safeParse({
      listenerId: "123e4567-e89b-12d3-a456-426614174000",
      description: "A".repeat(100),
    });
    expect(result.success).toBe(true);
  });

  it("should reject short description", () => {
    const result = callRequestSchema.safeParse({
      listenerId: "123e4567-e89b-12d3-a456-426614174000",
      description: "Too short",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid UUID", () => {
    const result = callRequestSchema.safeParse({
      listenerId: "invalid-uuid",
      description: "A".repeat(100),
    });
    expect(result.success).toBe(false);
  });
});

describe("ratingSchema", () => {
  it("should validate correct rating data", () => {
    const result = ratingSchema.safeParse({
      callSessionId: "123e4567-e89b-12d3-a456-426614174000",
      rating: 5,
    });
    expect(result.success).toBe(true);
  });

  it("should reject rating below 1", () => {
    const result = ratingSchema.safeParse({
      callSessionId: "123e4567-e89b-12d3-a456-426614174000",
      rating: 0,
    });
    expect(result.success).toBe(false);
  });

  it("should reject rating above 5", () => {
    const result = ratingSchema.safeParse({
      callSessionId: "123e4567-e89b-12d3-a456-426614174000",
      rating: 6,
    });
    expect(result.success).toBe(false);
  });
});

describe("misconductReportSchema", () => {
  it("should validate correct report data", () => {
    const result = misconductReportSchema.safeParse({
      callSessionId: "123e4567-e89b-12d3-a456-426614174000",
      reportedId: "123e4567-e89b-12d3-a456-426614174001",
      category: "harassment",
      note: "Test note",
    });
    expect(result.success).toBe(true);
  });

  it("should validate report without note", () => {
    const result = misconductReportSchema.safeParse({
      callSessionId: "123e4567-e89b-12d3-a456-426614174000",
      reportedId: "123e4567-e89b-12d3-a456-426614174001",
      category: "hate",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid category", () => {
    const result = misconductReportSchema.safeParse({
      callSessionId: "123e4567-e89b-12d3-a456-426614174000",
      reportedId: "123e4567-e89b-12d3-a456-426614174001",
      category: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("should reject note over 500 characters", () => {
    const result = misconductReportSchema.safeParse({
      callSessionId: "123e4567-e89b-12d3-a456-426614174000",
      reportedId: "123e4567-e89b-12d3-a456-426614174001",
      category: "harassment",
      note: "A".repeat(501),
    });
    expect(result.success).toBe(false);
  });
});
