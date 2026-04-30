import { Request, Response } from 'express';
import * as service from '../services/store.service';

/**
 * Store Controller - Xử lý các yêu cầu HTTP cho cửa hàng
 * Tuân theo RESTful conventions
 */

/**
 * Tạo cửa hàng mới
 * POST /api/stores
 */
export const create = async (req: Request, res: Response) => {
  try {
    // Lấy thông tin user từ JWT token
    const user = (req as any).user;
    const storeData = {
      ...req.body,
      CREATED_BY: user?.username || null // Set CREATED_BY từ USERNAME của user đăng nhập
    };
    
    const store = await service.createStore(storeData);
    res.status(201).json({
      success: true,
      message: 'Tạo cửa hàng thành công',
      data: store
    });
  } catch (error: any) {
    console.error('Error creating store:', error);
    res.status(400).json({ 
      success: false,
      message: 'Không thể tạo cửa hàng',
      error: error.message || 'Lỗi không xác định'
    });
  }
};

/**
 * Lấy danh sách cửa hàng
 * GET /api/stores
 */
export const list = async (req: Request, res: Response) => {
  try {
    const stores = await service.listStores();
    res.json({
      success: true,
      message: 'Lấy danh sách cửa hàng thành công',
      data: stores,
      total: stores.length
    });
  } catch (error: any) {
    console.error('Error listing stores:', error);
    res.status(500).json({ 
      success: false,
      message: 'Không thể lấy danh sách cửa hàng',
      error: error.message || 'Lỗi không xác định'
    });
  }
};

/**
 * Lấy thông tin cửa hàng theo ID
 * GET /api/stores/:id
 */
export const getOne = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const store = await service.getStore(id);
    if (!store) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy cửa hàng' 
      });
    }
    res.json({
      success: true,
      message: 'Lấy thông tin cửa hàng thành công',
      data: store
    });
  } catch (error: any) {
    console.error('Error getting store:', error);
    res.status(500).json({ 
      success: false,
      message: 'Không thể lấy thông tin cửa hàng',
      error: error.message || 'Lỗi không xác định'
    });
  }
};

/**
 * Cập nhật cửa hàng
 * PUT /api/stores/:id
 */
export const update = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    // Lấy thông tin user từ JWT token
    const user = (req as any).user;
    const updateData = {
      ...req.body,
      CREATED_BY: user?.username || null // Set CREATED_BY từ USERNAME của user đăng nhập
    };
    
    const store = await service.updateStore(id, updateData);
    if (!store) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy cửa hàng' 
      });
    }
    res.json({
      success: true,
      message: 'Cập nhật cửa hàng thành công',
      data: store
    });
  } catch (error: any) {
    console.error('Error updating store:', error);
    res.status(400).json({ 
      success: false,
      message: 'Không thể cập nhật cửa hàng',
      error: error.message || 'Lỗi không xác định'
    });
  }
};

/**
 * Xóa cửa hàng
 * DELETE /api/stores/:id
 */
export const remove = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await service.deleteStore(id);
    res.status(200).json({
      success: true,
      message: 'Xóa cửa hàng thành công'
    });
  } catch (error: any) {
    console.error('Error deleting store:', error);
    res.status(500).json({ 
      success: false,
      message: 'Không thể xóa cửa hàng',
      error: error.message || 'Lỗi không xác định'
    });
  }
};

/**
 * Tìm kiếm cửa hàng theo mã hoặc tên
 * GET /api/stores/search?keyword=
 */
export const search = async (req: Request, res: Response) => {
  try {
    const keyword = req.query.keyword as string;
    if (!keyword) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp từ khóa tìm kiếm'
      });
    }
    const stores = await service.searchStores(keyword);
    res.json({
      success: true,
      message: 'Tìm kiếm cửa hàng thành công',
      data: stores,
      total: stores.length
    });
  } catch (error: any) {
    console.error('Error searching stores:', error);
    res.status(500).json({
      success: false, 
      message: 'Không thể tìm kiếm cửa hàng',
      error: error.message || 'Lỗi không xác định'
    });
  }
};