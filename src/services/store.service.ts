import { AppDataSource } from '../data-source';
import { Store } from '../entity/Store';

// Helper to access Store repository
const storeRepo = () => AppDataSource.getRepository(Store);

/**
 * Create and persist a new store.
 * Tạo cửa hàng mới với các field theo cấu trúc TB_STORE
 */
export const createStore = async (data: Partial<Store>) => {
  const repo = storeRepo();
  const store = repo.create(data);
  return repo.save(store);
};

/**
 * List all stores
 * Lấy danh sách tất cả cửa hàng
 */
export const listStores = async () => {
  return storeRepo().find({
    order: { ID: 'DESC' }
  });
};

/**
 * Get a single store by ID
 * Lấy thông tin cửa hàng theo ID
 */
export const getStore = async (id: number) => {
  return storeRepo().findOne({
    where: { ID: id }
  });
};

/**
 * Get store by store code (STORE_CD)
 * Lấy cửa hàng theo mã cửa hàng
 */
export const getStoreByCode = async (storeCode: string) => {
  return storeRepo().findOne({
    where: { STORE_CD: storeCode }
  });
};

/**
 * Update store fields and return the updated entity.
 * Cập nhật thông tin cửa hàng
 */
export const updateStore = async (id: number, data: Partial<Store>) => {
  await storeRepo().update(id, data);
  return getStore(id);
};

/**
 * Delete a store by ID
 * Xóa cửa hàng theo ID
 */
export const deleteStore = async (id: number) => {
  return storeRepo().delete(id);
};

/**
 * Search stores by name or code
 * Tìm kiếm cửa hàng theo tên hoặc mã
 */
export const searchStores = async (keyword: string) => {
  return storeRepo()
    .createQueryBuilder('store')
    .where('store.STORE_NM LIKE :keyword OR store.STORE_CD LIKE :keyword', { 
      keyword: `%${keyword}%` 
    })
    .orderBy('store.ID', 'DESC')
    .getMany();
};

/**
 * Get active stores only
 * Lấy danh sách cửa hàng đang hoạt động
 */
export const getActiveStores = async () => {
  return storeRepo().find({
    where: { IS_ACTIVE: true },
    order: { ID: 'DESC' }
  });
};