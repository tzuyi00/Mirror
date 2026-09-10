import bcryptjs from "bcryptjs"
import { productPrisma } from "./db.js"

/**
 * User Service Layer
 * 
 * Handles all user-related database operations.
 * Uses the productPrisma singleton to avoid connection pooling issues.
 */

export const userService = {
  /**
   * Create a new user account
   * @param email - User email (will be normalized)
   * @param password - User password (will be hashed)
   * @param name - User name (optional, defaults to "User")
   * @returns User object without password
   * @throws Error if email already exists or validation fails
   */
  async createUser(email: string, password: string, name?: string) {
    // Normalize email
    const normalizedEmail = email.toLowerCase().trim()

    // Check if user already exists
    const existingUser = await productPrisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      throw new Error("An account with this email already exists")
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10)

    // Create user
    const user = await productPrisma.user.create({
      data: {
        email: normalizedEmail,
        name: name?.trim() || "User",
        hashedPassword,
      },
    })

    return {
      id: user.id,
      name: user.name,
      email: user.email,
    }
  },

  /**
   * Find user by email
   */
  async getUserByEmail(email: string) {
    const normalizedEmail = email.toLowerCase().trim()
    return productPrisma.user.findUnique({
      where: { email: normalizedEmail },
    })
  },

  /**
   * Find user by id
   */
  async getUserById(id: string) {
    return productPrisma.user.findUnique({
      where: { id },
    })
  },

  /**
   * Authenticate user with email and password
   * @param email - User email
   * @param password - User password (plain text)
   * @returns User object without password
   * @throws Error if user not found, no password set, or password is invalid
   */
  async authenticateUser(email: string, password: string) {
    const normalizedEmail = email.toLowerCase().trim()

    // Find user by email
    const user = await productPrisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    // User not found
    if (!user) {
      throw new Error("No user found with this email")
    }

    // User doesn't have a password (OAuth only user)
    if (!user.hashedPassword) {
      throw new Error(
        "This email is registered with OAuth. Please use Google or GitHub to sign in"
      )
    }

    // Verify password
    const isPasswordValid = await bcryptjs.compare(password, user.hashedPassword)

    if (!isPasswordValid) {
      throw new Error("Invalid password")
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    }
  },
}
