import { AppDataSource } from '../data-source';
import { User } from '../entity/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userRepo = () => AppDataSource.getRepository(User);

/**
 * Register a new user
 * Đăng ký user mới với cấu trúc TB_USER
 */
export const registerUser = async (data: {
  userCode: string;
  username: string;
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
  roleCode?: string;
}) => {
  const { userCode, username, email, password, fullName, phone, roleCode } = data;

  // Kiểm tra user đã tồn tại
  const existingUser = await userRepo().findOne({
    where: [
      { USER_CD: userCode },
      { USERNAME: username },
      { EMAIL: email }
    ]
  });

  if (existingUser) {
    throw new Error('User already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = userRepo().create({
    USER_CD: userCode,
    USERNAME: username,
    EMAIL: email,
    PASSWORD: hashedPassword,
    FULL_NAME: fullName || null,
    PHONE: phone || null,
    ROLE_CD: roleCode || 'USER',
    IS_ACTIVE: true,
    CREATED_BY: 'SYSTEM'
  });

  return userRepo().save(user);
};

/**
 * Login user
 * Đăng nhập với username hoặc email
 */
export const loginUser = async (data: { login: string; password: string }) => {
  const { login, password } = data;

  // Tìm user bằng USERNAME hoặc EMAIL
  const user = await userRepo().findOne({
    where: [
      { USERNAME: login },
      { EMAIL: login }
    ]
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Kiểm tra user có active không
  if (!user.IS_ACTIVE) {
    throw new Error('User is inactive');
  }

  const validPassword = await bcrypt.compare(password, user.PASSWORD);
  if (!validPassword) {
    throw new Error('Invalid credentials');
  }

  const token = jwt.sign(
    { 
      id: user.ID, 
      userCode: user.USER_CD,
      username: user.USERNAME,
      role: user.ROLE_CD 
    },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: '24h' }
  );

  // Destructuring để bỏ password
  const { PASSWORD: _, ...userWithoutPassword } = user;

  return { token, user: userWithoutPassword };
};

/**
 * Get user by ID
 * Lấy thông tin user theo ID
 */
export const getUserById = async (id: number) => {
  const user = await userRepo().findOne({
    where: { ID: id, IS_ACTIVE: true }
  });
  
  if (!user) {
    throw new Error('User not found');
  }

  const { PASSWORD: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

/**
 * Cập nhật FB_PSID cho user theo USERNAME
 */
export const updateFbPsid = async (username: string, fbPsid: string): Promise<boolean> => {
  const result = await userRepo().update(
    { USERNAME: username, IS_ACTIVE: true },
    { FB_PSID: fbPsid }
  );
  return (result.affected ?? 0) > 0;
};

