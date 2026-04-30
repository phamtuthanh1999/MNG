import { Request, Response } from 'express';
import * as service from '../services/export.service';
import * as excelService from '../services/export-excel.service';

/**
 * Export Controller - Xử lý các yêu cầu HTTP cho phiếu xuất kho
 * Tuân theo RESTful conventions
 */

// ===== EXPORT CONTROLLERS =====

/**
 * Tạo phiếu xuất mới
 * POST /api/exports
 */
export const create = async (req: Request, res: Response) => {
  try {
    // Lấy thông tin user từ JWT token
    const user = (req as any).user;
    const exportData = {
      ...req.body,
      CREATED_BY: user?.username || null // Set CREATED_BY từ USERNAME của user đăng nhập
    };
    
    const exportRecord = await service.createExport(exportData);
    res.status(201).json({
      success: true,
      message: 'Tạo phiếu xuất thành công',
      data: exportRecord
    });
  } catch (error: any) {
    console.error('Error creating export:', error);
    res.status(400).json({ 
      success: false,
      message: 'Không thể tạo phiếu xuất',
      error: error.message || 'Lỗi không xác định'
    });
  }
};

/**
 * Lấy danh sách phiếu xuất
 * GET /api/exports
 */
export const list = async (req: Request, res: Response) => {
  try {
    const exports = await service.listExports();
    res.json({
      success: true,
      message: 'Lấy danh sách phiếu xuất thành công',
      data: exports,
      total: exports.length
    });
  } catch (error: any) {
    console.error('Error listing exports:', error);
    res.status(500).json({ 
      success: false,
      message: 'Không thể lấy danh sách phiếu xuất',
      error: error.message || 'Lỗi không xác định'
    });
  }
};

/**
 * Lấy thông tin phiếu xuất theo ID
 * GET /api/exports/:id
 */
export const getOne = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ 
        success: false,
        message: 'ID không hợp lệ' 
      });
    }

    const exportRecord = await service.getExport(id);
    
    if (!exportRecord) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy phiếu xuất' 
      });
    }

    res.json({
      success: true,
      message: 'Lấy thông tin phiếu xuất thành công',
      data: exportRecord
    });
  } catch (error: any) {
    console.error('Error getting export:', error);
    res.status(500).json({ 
      success: false,
      message: 'Không thể lấy thông tin phiếu xuất',
      error: error.message || 'Lỗi không xác định'
    });
  }
};

/**
 * Cập nhật phiếu xuất
 * PUT /api/exports/:id
 */
export const update = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ 
        success: false,
        message: 'ID không hợp lệ' 
      });
    }

    const exportRecord = await service.updateExport(id, req.body);
    
    if (!exportRecord) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy phiếu xuất để cập nhật' 
      });
    }

    res.json({
      success: true,
      message: 'Cập nhật phiếu xuất thành công',
      data: exportRecord
    });
  } catch (error: any) {
    console.error('Error updating export:', error);
    res.status(400).json({ 
      success: false,
      message: 'Không thể cập nhật phiếu xuất',
      error: error.message || 'Lỗi không xác định'
    });
  }
};

/**
 * Xóa phiếu xuất
 * DELETE /api/exports/:id
 */
export const remove = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ 
        success: false,
        message: 'ID không hợp lệ' 
      });
    }

    const result = await service.removeExport(id);
    
    if (result.affected === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy phiếu xuất để xóa' 
      });
    }

    res.json({
      success: true,
      message: 'Xóa phiếu xuất thành công',
      data: result
    });
  } catch (error: any) {
    console.error('Error removing export:', error);
    res.status(500).json({ 
      success: false,
      message: 'Không thể xóa phiếu xuất',
      error: error.message || 'Lỗi không xác định'
    });
  }
};

/**
 * Tìm kiếm phiếu xuất
 * GET /api/exports/search?keyword=...
 */
export const search = async (req: Request, res: Response) => {
  try {
    const keyword = req.query.keyword as string | undefined;
    const storeCd = req.query.storeCd as string | undefined;
    const fromDate = req.query.fromDate as string | undefined;
    const toDate = req.query.toDate as string | undefined;
    const page = parseInt((req.query.page as string) || '1', 10);
    const pageSize = parseInt((req.query.pageSize as string) || '10', 10);

    const result = await service.searchExports({
      keyword,
      storeCd,
      fromDate,
      toDate,
      page: isNaN(page) ? 1 : page,
      pageSize: isNaN(pageSize) ? 10 : pageSize,
    });

    res.json({
      success: true,
      message: 'Tìm kiếm phiếu xuất thành công',
      data: result.data,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
      filters: {
        keyword: keyword || '',
        storeCd: storeCd || '',
        fromDate: fromDate || '',
        toDate: toDate || '',
      }
    });
  } catch (error: any) {
    console.error('Error searching exports:', error);
    res.status(500).json({ 
      success: false,
      message: 'Không thể tìm kiếm phiếu xuất',
      error: error.message || 'Lỗi không xác định'
    });
  }
};

// ===== EXPORT DETAIL CONTROLLERS =====

/**
 * Tạo chi tiết phiếu xuất mới
 * POST /api/exports/details
 */
export const createDetail = async (req: Request, res: Response) => {
  try {
    const exportDetail = await service.createExportDetail(req.body);
    res.status(201).json({
      success: true,
      message: 'Tạo chi tiết phiếu xuất thành công',
      data: exportDetail
    });
  } catch (error: any) {
    console.error('Error creating export detail:', error);
    res.status(400).json({ 
      success: false,
      message: 'Không thể tạo chi tiết phiếu xuất',
      error: error.message || 'Lỗi không xác định'
    });
  }
};

/**
 * Lấy danh sách chi tiết phiếu xuất theo EXPORT_ID
 * GET /api/exports/:exportId/details
 */
export const listDetails = async (req: Request, res: Response) => {
  try {
    const exportId = parseInt(req.params.exportId);
    if (isNaN(exportId)) {
      return res.status(400).json({ 
        success: false,
        message: 'Export ID không hợp lệ' 
      });
    }

    const details = await service.listExportDetailsByExportId(exportId);
    res.json({
      success: true,
      message: 'Lấy danh sách chi tiết phiếu xuất thành công',
      data: details,
      total: details.length
    });
  } catch (error: any) {
    console.error('Error listing export details:', error);
    res.status(500).json({ 
      success: false,
      message: 'Không thể lấy danh sách chi tiết phiếu xuất',
      error: error.message || 'Lỗi không xác định'
    });
  }
};

/**
 * Lấy chi tiết phiếu xuất theo ID
 * GET /api/exports/details/:id
 */
export const getOneDetail = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ 
        success: false,
        message: 'ID không hợp lệ' 
      });
    }

    const detail = await service.getExportDetail(id);
    
    if (!detail) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy chi tiết phiếu xuất' 
      });
    }

    res.json({
      success: true,
      message: 'Lấy thông tin chi tiết phiếu xuất thành công',
      data: detail
    });
  } catch (error: any) {
    console.error('Error getting export detail:', error);
    res.status(500).json({ 
      success: false,
      message: 'Không thể lấy thông tin chi tiết phiếu xuất',
      error: error.message || 'Lỗi không xác định'
    });
  }
};

/**
 * Cập nhật chi tiết phiếu xuất
 * PUT /api/exports/details/:id
 */
export const updateDetail = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ 
        success: false,
        message: 'ID không hợp lệ' 
      });
    }

    const detail = await service.updateExportDetail(id, req.body);
    
    if (!detail) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy chi tiết phiếu xuất để cập nhật' 
      });
    }

    res.json({
      success: true,
      message: 'Cập nhật chi tiết phiếu xuất thành công',
      data: detail
    });
  } catch (error: any) {
    console.error('Error updating export detail:', error);
    res.status(400).json({ 
      success: false,
      message: 'Không thể cập nhật chi tiết phiếu xuất',
      error: error.message || 'Lỗi không xác định'
    });
  }
};

/**
 * Xóa chi tiết phiếu xuất
 * DELETE /api/exports/details/:id
 */
export const removeDetail = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ 
        success: false,
        message: 'ID không hợp lệ' 
      });
    }

    const result = await service.removeExportDetail(id);
    
    if (result.affected === 0) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy chi tiết phiếu xuất để xóa' 
      });
    }

    res.json({
      success: true,
      message: 'Xóa chi tiết phiếu xuất thành công',
      data: result
    });
  } catch (error: any) {
    console.error('Error removing export detail:', error);
    res.status(500).json({ 
      success: false,
      message: 'Không thể xóa chi tiết phiếu xuất',
      error: error.message || 'Lỗi không xác định'
    });
  }
};

/**
 * Download template Excel
 * GET /api/exports/excel/template
 */
export const downloadTemplate = async (_req: Request, res: Response) => {
  try {
    const buffer = await excelService.generateTemplate();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=export_template.xlsx');
    res.send(Buffer.from(buffer));
  } catch (error: any) {
    console.error('Error generating export template:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tạo file template',
      error: error.message || 'Lỗi không xác định'
    });
  }
};

/**
 * Upload và validate file Excel xuất hàng
 * POST /api/exports/excel/upload
 */
export const uploadExcel = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn file Excel để upload'
      });
    }

    const originalName = req.file.originalname.toLowerCase();
    if (!originalName.endsWith('.xlsx')) {
      return res.status(400).json({
        success: false,
        message: 'Chỉ chấp nhận file định dạng .xlsx'
      });
    }

    const { rows, errors } = await excelService.parseAndValidateExcel(req.file.buffer);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Dữ liệu không hợp lệ (${errors.length} lỗi)`,
        errors,
        totalRows: rows.length
      });
    }

    const stockErrors = await excelService.validateProductCodesAndStock(rows);
    if (stockErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Dữ liệu không hợp lệ (${stockErrors.length} lỗi)`,
        errors: stockErrors,
        totalRows: rows.length
      });
    }

    const { storeCd, exportDt, note } = req.body;
    if (!storeCd || !exportDt) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin kho (storeCd) hoặc ngày xuất (exportDt)'
      });
    }

    const user = (req as any).user;
    const exportRecord = await excelService.saveExportFromExcel(
      rows,
      storeCd,
      exportDt,
      note || null,
      user?.username || 'system'
    );

    res.status(201).json({
      success: true,
      message: `Xuất hàng thành công ${rows.length} sản phẩm`,
      data: exportRecord,
      totalRows: rows.length
    });
  } catch (error: any) {
    console.error('Error uploading export excel:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể xử lý file Excel',
      error: error.message || 'Lỗi không xác định'
    });
  }
};