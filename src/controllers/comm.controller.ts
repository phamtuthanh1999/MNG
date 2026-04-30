import { Request, Response } from 'express';
import * as service from '../services/comm.service';

/**
 * Comm Controller - Xử lý các yêu cầu HTTP cho đơn vị
 * Tuân theo RESTful conventions
 */

/**
 * Tạo đơn vị mới
 * POST /api/comms
 */
export const create = async (req: Request, res: Response) => {
  try {
    // Lấy thông tin user từ JWT token
    const user = (req as any).user;
    const commData = {
      ...req.body,
      REQ_ID: user?.username || null // Set REQ_ID từ USERNAME của user đăng nhập
    };
    
    const comm = await service.createComm(commData);
    res.status(201).json({
      success: true,
      message: 'Tạo đơn vị thành công',
      data: comm
    });
  } catch (error: any) {
    console.error('Error creating comm:', error);
    res.status(400).json({ 
      success: false,
      message: 'Không thể tạo đơn vị',
      error: error.message || 'Lỗi không xác định'
    });
  }
};

/**
 * Lấy danh sách đơn vị
 * GET /api/comms
 */
export const list = async (req: Request, res: Response) => {
  try {
    const comms = await service.listComms();
    res.json({
      success: true,
      message: 'Lấy danh sách đơn vị thành công',
      data: comms,
      total: comms.length
    });
  } catch (error: any) {
    console.error('Error listing comms:', error);
    res.status(500).json({ 
      success: false,
      message: 'Không thể lấy danh sách đơn vị',
      error: error.message || 'Lỗi không xác định'
    });
  }
};

/**
 * Lấy thông tin đơn vị theo ID
 * GET /api/comms/:id
 */
export const getOne = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const comm = await service.getComm(id);
    if (!comm) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy đơn vị' 
      });
    }
    res.json({
      success: true,
      message: 'Lấy thông tin đơn vị thành công',
      data: comm
    });
  } catch (error: any) {
    console.error('Error getting comm:', error);
    res.status(500).json({ 
      success: false,
      message: 'Không thể lấy thông tin đơn vị',
      error: error.message || 'Lỗi không xác định'
    });
  }
};

/**
 * Cập nhật đơn vị
 * PUT /api/comms/:id
 */
export const update = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    // Lấy thông tin user từ JWT token
    const user = (req as any).user;
    const updateData = {
      ...req.body,
      REQ_ID: user?.username || null // Set REQ_ID từ USERNAME của user đăng nhập
    };
    
    const comm = await service.updateComm(id, updateData);
    if (!comm) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy đơn vị' 
      });
    }
    res.json({
      success: true,
      message: 'Cập nhật đơn vị thành công',
      data: comm
    });
  } catch (error: any) {
    console.error('Error updating comm:', error);
    res.status(400).json({ 
      success: false,
      message: 'Không thể cập nhật đơn vị',
      error: error.message || 'Lỗi không xác định'
    });
  }
};

/**
 * Xóa đơn vị
 * DELETE /api/comms/:id
 */
export const remove = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await service.deleteComm(id);
    res.status(200).json({
      success: true,
      message: 'Xóa đơn vị thành công'
    });
  } catch (error: any) {
    console.error('Error deleting comm:', error);
    res.status(500).json({ 
      success: false,
      message: 'Không thể xóa đơn vị',
      error: error.message || 'Lỗi không xác định'
    });
  }
};

/**
 * Tìm kiếm đơn vị
 * GET /api/comms/search?keyword=
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
    const comms = await service.searchComms(keyword);
    res.json({
      success: true,
      message: 'Tìm kiếm đơn vị thành công',
      data: comms,
      total: comms.length
    });
  } catch (error: any) {
    console.error('Error searching comms:', error);
    res.status(500).json({
      success: false, 
      message: 'Không thể tìm kiếm đơn vị',
      error: error.message || 'Lỗi không xác định'
    });
  }
};

/**
 * Lấy danh sách đơn vị đang hoạt động
 * GET /api/comms/active
 */
export const getActive = async (req: Request, res: Response) => {
  try {
    const comms = await service.getActiveComms();
    res.json({
      success: true,
      message: 'Lấy danh sách đơn vị hoạt động thành công',
      data: comms,
      total: comms.length
    });
  } catch (error: any) {
    console.error('Error getting active comms:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy danh sách đơn vị hoạt động',
      error: error.message || 'Lỗi không xác định'
    });
  }
};