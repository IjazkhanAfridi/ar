import { db } from '../config/mysql-database.js';
import { users } from '../models/mysql-schema.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';

class UserService {
  /**
   * Create a new user
   */
  async createUser(userData) {
    const { email, password, name, role = 'user' } = userData;

    // Check if user already exists
    const existingUser = await this.getUserByEmail(email);
    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = {
      id: `user_${Date.now()}_${nanoid(9)}`,
      email,
      name,
      password: hashedPassword,
      role,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(users).values(newUser);
    
    // Fetch the created user
    const [user] = await db.select().from(users).where(eq(users.id, newUser.id));
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Get user by ID
   */
  async getUserById(id) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return user;
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    return user;
  }

  /**
   * Verify user password
   */
  async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Update user
   */
  async updateUser(id, updateData) {
    const updateFields = {
      ...updateData,
      updatedAt: new Date(),
    };

    // Hash password if provided
    if (updateData.password) {
      updateFields.password = await bcrypt.hash(updateData.password, 12);
    }

    await db
      .update(users)
      .set(updateFields)
      .where(eq(users.id, id));

    // Fetch the updated user
    const [updatedUser] = await db.select().from(users).where(eq(users.id, id));
    
    if (!updatedUser) {
      throw new Error('User not found');
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  /**
   * Update user status (activate/deactivate)
   */
  async updateUserStatus(id, isActive) {
    await db
      .update(users)
      .set({ 
        isActive, 
        updatedAt: new Date() 
      })
      .where(eq(users.id, id));

    // Fetch the updated user
    const [updatedUser] = await db.select().from(users).where(eq(users.id, id));
    
    if (!updatedUser) {
      throw new Error('User not found');
    }

    const { password: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  /**
   * Delete user
   */
  async deleteUser(id) {
    // Check if user exists first
    const [existingUser] = await db.select().from(users).where(eq(users.id, id));
    
    if (!existingUser) {
      throw new Error('User not found');
    }

    await db.delete(users).where(eq(users.id, id));

    return { message: 'User deleted successfully' };
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers() {
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users);

    return allUsers;
  }

  /**
   * Get user profile (without sensitive data)
   */
  async getUserProfile(id) {
    const user = await this.getUserById(id);
    
    if (!user) {
      throw new Error('User not found');
    }

    const { password: _, ...userProfile } = user;
    return userProfile;
  }
}

export const userService = new UserService();
