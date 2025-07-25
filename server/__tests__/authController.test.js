const mockVerifyIdToken = jest.fn();
const mockFindUnique = jest.fn();
const mockCreate = jest.fn();

jest.mock("../firebase", () => ({
  auth: () => ({
    verifyIdToken: mockVerifyIdToken,
  }),
}));

jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => ({
    user: {
      findUnique: mockFindUnique,
      create: mockCreate,
    },
  })),
}));

const authController = require("../controllers/authController");

describe("AuthController", () => {
  let mockReq, mockRes;

  beforeEach(() => {
    jest.clearAllMocks();

    // mock request object
    mockReq = {
      body: {},
      user: {},
      headers: {},
    };

    mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    };

    process.env.NODE_ENV = "test";
  });

  describe("firebaseLogin", () => {
    test("should successfully login existing user", async () => {
      const mockIdToken = "valid-id-token";
      const mockDecodedToken = {
        uid: "test-firebase-uid",
        email: "test@example.com",
      };
      const mockExistingUser = {
        id: 1,
        firebaseUid: "test-firebase-uid",
        email: "test@example.com",
        hasCompletedOnboarding: true,
      };

      mockReq.body = { idToken: mockIdToken };
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);
      mockFindUnique.mockResolvedValue(mockExistingUser);

      await authController.firebaseLogin(mockReq, mockRes);

      expect(mockVerifyIdToken).toHaveBeenCalledWith(mockIdToken);
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { firebaseUid: "test-firebase-uid" },
      });
      expect(mockRes.cookie).toHaveBeenCalledWith("token", mockIdToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Firebase login successful",
        user: {
          id: 1,
          email: "test@example.com",
          hasCompletedOnboarding: true,
        },
      });
    });

    test("should create new user if not exists", async () => {
      const mockIdToken = "valid-id-token";
      const mockDecodedToken = {
        uid: "new-firebase-uid",
        email: "newuser@example.com",
      };
      const mockNewUser = {
        id: 2,
        firebaseUid: "new-firebase-uid",
        email: "newuser@example.com",
        hasCompletedOnboarding: false,
      };

      mockReq.body = { idToken: mockIdToken };
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);
      mockFindUnique.mockResolvedValue(null);
      mockCreate.mockResolvedValue(mockNewUser);

      await authController.firebaseLogin(mockReq, mockRes);

      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          firebaseUid: "new-firebase-uid",
          email: "newuser@example.com",
          createdAt: expect.any(Date),
        },
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Firebase login successful",
        user: {
          id: 2,
          email: "newuser@example.com",
          hasCompletedOnboarding: false,
        },
      });
    });

    test("should handle invalid Firebase token", async () => {
      const mockIdToken = "invalid-token";
      const firebaseError = new Error("Invalid token");

      mockReq.body = { idToken: mockIdToken };
      mockVerifyIdToken.mockRejectedValue(firebaseError);

      await authController.firebaseLogin(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Invalid Firebase ID token",
      });
    });

    test("should handle missing idToken", async () => {
      mockReq.body = {};

      await authController.firebaseLogin(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe("logout", () => {
    test("should clear cookie and return success message", () => {
      authController.logout(mockReq, mockRes);

      expect(mockRes.clearCookie).toHaveBeenCalledWith("token", {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Logged out successfully",
      });
    });

    test("should clear secure cookie in production", () => {
      process.env.NODE_ENV = "production";

      authController.logout(mockReq, mockRes);

      expect(mockRes.clearCookie).toHaveBeenCalledWith("token", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
      });

      process.env.NODE_ENV = "test";
    });
  });

  describe("me", () => {
    test("should return user data without password", () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        hasCompletedOnboarding: true,
      };

      mockReq.user = mockUser;

      authController.me(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        id: 1,
        email: "test@example.com",
        firstName: "John",
        lastName: "Doe",
        hasCompletedOnboarding: true,
      });
    });

    test("should handle missing user data", () => {
      mockReq.user = null;

      authController.me(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Could not fetch user",
      });
    });

    test("should exclude password field from response", () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        firstName: "John",
        password: "secret123",
        age: 30,
      };

      mockReq.user = mockUser;

      authController.me(mockReq, mockRes);

      const responseData = mockRes.json.mock.calls[0][0];

      // The controller uses destructuring to exclude password
      expect(responseData).not.toHaveProperty("password");
      expect(responseData).toHaveProperty("id");
      expect(responseData).toHaveProperty("email");
      expect(responseData).toHaveProperty("firstName");
      expect(responseData).toHaveProperty("age");
    });
  });

  describe("Integration Tests", () => {
    test("should handle database errors gracefully", async () => {
      const mockIdToken = "valid-token";
      const mockDecodedToken = {
        uid: "test-uid",
        email: "test@example.com",
      };

      mockReq.body = { idToken: mockIdToken };
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);
      mockFindUnique.mockRejectedValue(new Error("Database connection failed"));

      await authController.firebaseLogin(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    test("should handle successful complete flow", async () => {
      const mockIdToken = "complete-flow-token";
      const mockDecodedToken = {
        uid: "complete-flow-uid",
        email: "complete@example.com",
      };
      const mockUser = {
        id: 123,
        firebaseUid: "complete-flow-uid",
        email: "complete@example.com",
        hasCompletedOnboarding: true,
      };

      mockReq.body = { idToken: mockIdToken };
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);
      mockFindUnique.mockResolvedValue(mockUser);

      await authController.firebaseLogin(mockReq, mockRes);

      expect(mockVerifyIdToken).toHaveBeenCalledWith(mockIdToken);
      expect(mockFindUnique).toHaveBeenCalledWith({
        where: { firebaseUid: "complete-flow-uid" },
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Firebase login successful",
        user: {
          id: 123,
          email: "complete@example.com",
          hasCompletedOnboarding: true,
        },
      });
    });
  });
});
