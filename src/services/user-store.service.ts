import { AppDataSource } from '../data-source';
import { UserStore } from '../entity/UserStore';

// Helper to access UserStore repository
const userStoreRepo = () => AppDataSource.getRepository(UserStore);

/**
 * Create and persist a new user-store relation.
 * Tạo liên kết user-store mới với các field theo cấu trúc TB_USER_STORE
 */
export const createUserStore = async (data: Partial<UserStore>) => {
  const repo = userStoreRepo();
  const userStore = repo.create(data);
  return repo.save(userStore);
};

/**
 * List all user-store relations
 * Lấy danh sách tất cả liên kết user-store
 */
export const listUserStores = async () => {
  return userStoreRepo().find({
    order: { ID: 'DESC' }
  });
};

/**
 * Get a single user-store relation by ID
 * Lấy thông tin liên kết user-store theo ID
 */
export const getUserStore = async (id: number) => {
  return userStoreRepo().findOne({
    where: { ID: id }
  });
};

/**
 * Get stores by user code
 * Lấy danh sách store của user theo mã user
 */
export const getStoresByUser = async (userCode: string) => {
  return userStoreRepo()
    .createQueryBuilder('userStore')
    .where('userStore.USER_CD = :userCode', { userCode })
    .orderBy('userStore.ID', 'DESC')
    .getMany();
};

/**
 * Get users by store code
 * Lấy danh sách user của store theo mã store
 */
export const getUsersByStore = async (storeCode: string) => {
  return userStoreRepo()
    .createQueryBuilder('userStore')
    .where('userStore.STORE_CD = :storeCode', { storeCode })
    .orderBy('userStore.ID', 'DESC')
    .getMany();
};

/**
 * Check if user has access to store
 * Kiểm tra user có quyền truy cập store không
 */
export const checkUserStoreAccess = async (userCode: string, storeCode: string) => {
  return userStoreRepo().findOne({
    where: { 
      USER_CD: userCode,
      STORE_CD: storeCode
    }
  });
};

/**
 * Update user-store relation
 * Cập nhật thông tin liên kết user-store (chủ yếu là vai trò)
 */
export const updateUserStore = async (id: number, data: Partial<UserStore>) => {
  await userStoreRepo().update(id, data);
  return getUserStore(id);
};

/**
 * Delete a user-store relation by ID
 * Xóa liên kết user-store theo ID
 */
export const deleteUserStore = async (id: number) => {
  return userStoreRepo().delete(id);
};

/**
 * Remove user from specific store
 * Xóa user khỏi store cụ thể
 */
export const removeUserFromStore = async (userCode: string, storeCode: string) => {
  return userStoreRepo().delete({
    USER_CD: userCode,
    STORE_CD: storeCode
  });
};

/**
 * Get user role in specific store
 * Lấy vai trò của user tại store cụ thể
 */
export const getUserRoleInStore = async (userCode: string, storeCode: string) => {
  const userStore = await userStoreRepo().findOne({
    where: { 
      USER_CD: userCode,
      STORE_CD: storeCode
    }
  });
  return userStore?.ROLE_STORE || null;
};