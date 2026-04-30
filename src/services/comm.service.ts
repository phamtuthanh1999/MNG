import { AppDataSource } from '../data-source';
import { Comm } from '../entity/Comm';

// Helper to access Comm repository
const commRepo = () => AppDataSource.getRepository(Comm);

/**
 * Create and persist a new comm.
 * Tạo đơn vị mới với các field theo cấu trúc TB_MST_COM
 */
export const createComm = async (data: Partial<Comm>) => {
  const repo = commRepo();
  const comm = repo.create(data);
  return repo.save(comm);
};

/**
 * List all comms
 * Lấy danh sách tất cả đơn vị
 */
export const listComms = async () => {
  return commRepo().find({
    order: { ID: 'DESC' }
  });
};

/**
 * Get a single comm by ID
 * Lấy thông tin đơn vị theo ID
 */
export const getComm = async (id: number) => {
  return commRepo().findOne({
    where: { ID: id }
  });
};

/**
 * Get comm by unit code (UN_CD)
 * Lấy đơn vị theo mã đơn vị
 */
export const getCommByCode = async (unitCode: string) => {
  return commRepo().findOne({
    where: { UN_CD: unitCode }
  });
};

/**
 * Update comm fields and return the updated entity.
 * Cập nhật thông tin đơn vị
 */
export const updateComm = async (id: number, data: Partial<Comm>) => {
  await commRepo().update(id, data);
  return getComm(id);
};

/**
 * Delete a comm by ID
 * Xóa đơn vị theo ID
 */
export const deleteComm = async (id: number) => {
  return commRepo().delete(id);
};

/**
 * Search comms by name or code
 * Tìm kiếm đơn vị theo tên hoặc mã
 */
export const searchComms = async (keyword: string) => {
  return commRepo()
    .createQueryBuilder('comm')
    .where('comm.UN_NM LIKE :keyword OR comm.UN_CD LIKE :keyword', { 
      keyword: `%${keyword}%` 
    })
    .orderBy('comm.ID', 'DESC')
    .getMany();
};

/**
 * Get active comms only
 * Lấy danh sách đơn vị đang hoạt động
 */
export const getActiveComms = async () => {
  return commRepo().find({
    where: { IS_ACTIVE: true },
    order: { ID: 'DESC' }
  });
};