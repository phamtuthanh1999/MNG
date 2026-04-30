import { Request, Response } from 'express';
import * as service from '../services/product.service';
import * as productExcelService from '../services/product-excel.service';

/**
 * Product Controller - Xử lý các yêu cầu HTTP cho sản phẩm
 * Tuân theo RESTful conventions
 */

/**
 * Tạo sản phẩm mới  
 * POST /api/products
 * 
 * Body không cần truyền PD_CD - sẽ được tự động tạo theo format PD0001, PD0002, ...
 * Required: PD_NM, STORE_ID, QUANTITY
 * Optional: UNIT_CD, DESCRIPTION, IMG_URL
 */
export const create = async (req: Request, res: Response) => {
  try {
    // Lấy thông tin user từ JWT token
    const user = (req as any).user;
    const productData = {
      ...req.body,
      // Không set PD_CD - sẽ được tự động tạo bởi @BeforeInsert hook 
      REQ_ID: user?.username || null, // Set REQ_ID từ USERNAME của user đăng nhập
      USER_LOGIN: user?.username || null // Set USER_LOGIN từ USERNAME của user đăng nhập
    };
    
    const product = await service.createProduct(productData);
    res.status(201).json({
      success: true,
      message: 'Tạo sản phẩm thành công',
      data: product,
      note: `Mã sản phẩm được tự động tạo: ${product.PD_CD}`
    });
  } catch (error: any) {
    console.error('Error creating product:', error);
    res.status(400).json({ 
      success: false,
      message: 'Không thể tạo sản phẩm',
      error: error.message || 'Lỗi không xác định'
    });
  }
};

/**
 * Lấy danh sách sản phẩm
 * GET /api/products
 */
export const list = async (req: Request, res: Response) => {
  try {
    const products = await service.listProducts();
    res.json({
      success: true,
      message: 'Lấy danh sách sản phẩm thành công',
      data: products,
      total: products.length
    });
  } catch (error: any) {
    console.error('Error listing products:', error);
    res.status(500).json({ 
      success: false,
      message: 'Không thể lấy danh sách sản phẩm',
      error: error.message || 'Lỗi không xác định'
    });
  }
};

/**
 * Lấy thông tin sản phẩm theo ID
 * GET /api/products/:id
 */
export const getOne = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const product = await service.getProduct(id);
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy sản phẩm' 
      });
    }
    res.json({
      success: true,
      message: 'Lấy thông tin sản phẩm thành công',
      data: product
    });
  } catch (error: any) {
    console.error('Error getting product:', error);
    res.status(500).json({ 
      success: false,
      message: 'Không thể lấy thông tin sản phẩm',
      error: error.message || 'Lỗi không xác định'
    });
  }
};

/**
 * Cập nhật sản phẩm
 * PUT /api/products/:id
 */
export const update = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    // Lấy thông tin user từ JWT token
    const user = (req as any).user;
    const updateData = {
      ...req.body,
      REQ_ID: user?.username || null, // Set REQ_ID từ USERNAME của user đăng nhập
      USER_LOGIN: user?.username || null // Set USER_LOGIN từ USERNAME của user đăng nhập
    };
    
    const product = await service.updateProduct(id, updateData);
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Không tìm thấy sản phẩm' 
      });
    }
    res.json({
      success: true,
      message: 'Cập nhật sản phẩm thành công',
      data: product
    });
  } catch (error: any) {
    console.error('Error updating product:', error);
    res.status(400).json({ 
      success: false,
      message: 'Không thể cập nhật sản phẩm',
      error: error.message || 'Lỗi không xác định'
    });
  }
};

/**
 * Xóa sản phẩm
 * DELETE /api/products/:id
 */
export const remove = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await service.deleteProduct(id);
    res.status(200).json({
      success: true,
      message: 'Xóa sản phẩm thành công'
    });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    res.status(500).json({ 
      success: false,
      message: 'Không thể xóa sản phẩm',
      error: error.message || 'Lỗi không xác định'
    });
  }
};

/**
 * Tìm kiếm sản phẩm (phân trang + bộ lọc)
 * GET /api/products/search?keyword=&storeId=&stockFilter=&page=&pageSize=
 */
export const search = async (req: Request, res: Response) => {
  try {
    const keyword = req.query.keyword as string | undefined;
    const storeId = req.query.storeId as string | undefined;
    const stockFilter = req.query.stockFilter as string | undefined;
    const page = parseInt((req.query.page as string) || '1', 10);
    const pageSize = parseInt((req.query.pageSize as string) || '10', 10);

    const result = await service.searchProducts({
      keyword,
      storeId,
      stockFilter,
      page: isNaN(page) ? 1 : page,
      pageSize: isNaN(pageSize) ? 10 : pageSize,
    });

    res.json({
      success: true,
      message: 'Tìm kiếm sản phẩm thành công',
      data: result.data,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
      filters: {
        keyword: keyword || '',
        storeId: storeId || '',
        stockFilter: stockFilter || '',
      }
    });
  } catch (error: any) {
    console.error('Error searching products:', error);
    res.status(500).json({
      success: false, 
      message: 'Không thể tìm kiếm sản phẩm',
      error: error.message || 'Lỗi không xác định'
    });
  }
};

/**
 * Download template Excel sản phẩm
 * GET /api/products/excel/template
 */
export const downloadProductTemplate = async (_req: Request, res: Response) => {
  try {
    const buffer = await productExcelService.generateProductTemplate();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=product_template.xlsx');
    res.send(Buffer.from(buffer));
  } catch (error: any) {
    console.error('Error generating product template:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể tạo file template',
      error: error.message || 'Lỗi không xác định'
    });
  }
};

/**
 * Upload và validate file Excel sản phẩm
 * POST /api/products/excel/upload
 */
export const uploadProductExcel = async (req: Request, res: Response) => {
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

    // Parse and validate data format
    const { rows, errors } = await productExcelService.parseAndValidateProductExcel(req.file.buffer);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Dữ liệu không hợp lệ (${errors.length} lỗi)`,
        errors,
        totalRows: rows.length
      });
    }

    // Save to database
    const user = (req as any).user;
    const savedProducts = await productExcelService.saveProductsFromExcel(
      rows,
      user?.username || 'system'
    );

    res.status(201).json({
      success: true,
      message: `Nhập thành công ${savedProducts.length} sản phẩm`,
      data: savedProducts,
      totalRows: savedProducts.length
    });
  } catch (error: any) {
    console.error('Error uploading product excel:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể xử lý file Excel',
      error: error.message || 'Lỗi không xác định'
    });
  }
};

