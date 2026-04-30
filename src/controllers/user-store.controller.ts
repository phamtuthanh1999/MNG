import { Request, Response } from 'express';
import * as service from '../services/user-store.service';

/**
 * UserStore Controller - Xử lý các yêu cầu HTTP cho liên kết user-store
 * Tuân theo RESTful conventions
 */

/**
 * Gán user vào store
 * POST /api/user-stores
 */
export const assignUserToStore = async (req: Request, res: Response) => {
  try {
    // Lấy thông tin user từ JWT token
    const user = (req as any).user;
    const userStoreData = {
      ...req.body,
      CREATED_BY: user?.username || null // Set CREATED_BY từ USERNAME của user đăng nhập
    };
    
    const userStore = await service.createUserStore(userStoreData);
    res.status(201).json({
      success: true,
      message: 'Gán user vào store thành công',
      data: userStore
    });
  } catch (error: any) {
    console.error('Error assigning user to store:', error);
    res.status(400).json({ 
      success: false,
      message: 'Không thể gán user vào store',
      error: error.message || 'Lỗi không xác định'
    });
  }
};

/**
 * Lấy danh sách tất cả liên kết user-store
 * GET /api/user-stores
 */
export const list = async (req: Request, res: Response) => {
  try {
    const userStores = await service.listUserStores();
    res.json({
      success: true,
      message: 'Lấy danh sách liên kết user-store thành công',
      data: userStores,
      total: userStores.length
    });
  } catch (error: any) {
    console.error('Error listing user-stores:', error);
    res.status(500).json({ 
      success: false,
      message: 'Không thể lấy danh sách liên kết user-store',
      error: error.message || 'Lỗi không xác định'
    });
  }
};

/**
 * Lấy thông tin liên kết user-store theo ID
 * GET /api/user-stores/:id
 */
export const getOne = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const userStore = await service.getUserStore(id);
    if (!userStore) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy liên kết user-store' 
      });
    }
    res.json({
      success: true,
      message: 'Lấy thông tin liên kết user-store thành công',
      data: userStore
    });
  } catch (error: any) {
    console.error('Error getting user-store:', error);
    res.status(500).json({ 
      success: false,
      message: 'Không thể lấy thông tin liên kết user-store',
      error: error.message || 'Lỗi không xác định'
    });
  }
};

/**
 * Lấy danh sách store của user
 * GET /api/users/:userCode/stores
 */
export const getUserStores = async (req: Request, res: Response) => {
  try {
    const userCode = req.params.userCode;
    const stores = await service.getStoresByUser(userCode);
    res.json({
      success: true,
      message: 'Lấy danh sách store của user thành công',
      data: stores,
      total: stores.length
    });
  } catch (error: any) {
    console.error('Error getting user stores:', error);
    res.status(500).json({ 
      success: false,
      message: 'Không thể lấy danh sách store của user',
      error: error.message || 'Lỗi không xác định'
    });
  }
};

/**
 * Lấy danh sách user của store
 * GET /api/stores/:storeCode/users
 */
export const getStoreUsers = async (req: Request, res: Response) => {
  try {
    const storeCode = req.params.storeCode;
    const users = await service.getUsersByStore(storeCode);
    res.json({
      success: true,
      message: 'Lấy danh sách user của store thành công',
      data: users,
      total: users.length
    });
  } catch (error: any) {
    console.error('Error getting store users:', error);
    res.status(500).json({ 
      success: false,
      message: 'Không thể lấy danh sách user của store',
      error: error.message || 'Lỗi không xác định'
    });
  }
};

/**
 * Cập nhật vai trò của user tại store
 * PUT /api/user-stores/:id
 */
export const update = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const userStore = await service.updateUserStore(id, req.body);
    if (!userStore) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy liên kết user-store' 
      });
    }
    res.json({
      success: true,
      message: 'Cập nhật vai trò user tại store thành công',
      data: userStore
    });
  } catch (error: any) {
    console.error('Error updating user-store:', error);
    res.status(400).json({ 
      success: false,
      message: 'Không thể cập nhật vai trò user tại store',
      error: error.message || 'Lỗi không xác định'
    });
  }
};

/**
 * Xóa liên kết user-store
 * DELETE /api/user-stores/:id
 */
export const remove = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await service.deleteUserStore(id);
    res.status(200).json({
      success: true,
      message: 'Xóa liên kết user-store thành công'
    });
  } catch (error: any) {
    console.error('Error deleting user-store:', error);
    res.status(500).json({ 
      success: false,
      message: 'Không thể xóa liên kết user-store',
      error: error.message || 'Lỗi không xác định'
    });
  }
};