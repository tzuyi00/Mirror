import { Controller, Post, Body, Route, Response } from 'tsoa';
import { userService } from '../services/userService.js';
import {
  AuthUser,
  SignupRequest,
  SignupResponse,
  VerifyCredentialsRequest,
  VerifyCredentialsResponse,
  AuthErrorResponse,
} from '../dtos/AuthDTOs.js';

@Route('api/auth')
export class AuthController extends Controller {
  /**
   * /api/auth/signup 
   * Create a new user account
   * @param request Signup request with email, password, and optional name
   * @returns Created user data
   */
  @Post('signup')
  @Response<AuthErrorResponse>(400, 'Bad Request - Invalid input or email already exists')
  @Response<AuthErrorResponse>(500, 'Internal Server Error')
  async signup(
    @Body() request: SignupRequest
  ): Promise<SignupResponse> {
    try {
      const { email, password, name } = request;

      // Validate input
      if (!email || !password) {
        this.setStatus(400);
        throw new Error('Email and password are required');
      }

      if (password.length < 8) {
        this.setStatus(400);
        throw new Error('Password must be at least 8 characters');
      }

      // Create user via service layer
      const user = await userService.createUser(email, password, name);

      this.setStatus(201);
      return {
        message: 'User created successfully',
        user,
      };
    } catch (error: any) {
      console.error('[AuthController Signup Error]', error);

      if (error?.message?.includes('already exists')) {
        this.setStatus(400);
        throw new Error(error.message);
      }

      this.setStatus(500);
      throw new Error('An error occurred while creating the account');
    }
  }

  /**
   * /api/auth/verify-credentials
   * Verify user credentials (for NextAuth credentials provider)
   * @param request Credentials with email and password
   * @returns User data if credentials are valid
   */
  @Post('verify-credentials')
  @Response<AuthErrorResponse>(400, 'Bad Request - Invalid credentials')
  @Response<AuthErrorResponse>(500, 'Internal Server Error')
  async verifyCredentials(
    @Body() request: VerifyCredentialsRequest
  ): Promise<VerifyCredentialsResponse> {
    try {
      const { email, password } = request;

      // Validate input
      if (!email || !password) {
        this.setStatus(400);
        throw new Error('Email and password are required');
      }

      // Authenticate user
      const user = await userService.authenticateUser(email, password);

      return {
        message: 'Credentials verified successfully',
        user,
      };
    } catch (error: any) {
      console.error('[AuthController Verify Error]', error);

      if (error?.message) {
        this.setStatus(400);
        throw new Error(error.message);
      }

      this.setStatus(500);
      throw new Error('An error occurred during authentication');
    }
  }
}
