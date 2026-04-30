import { Request, Response } from 'express';
import * as service from '../services/report.service';

/**
 * Reports Controller - Tổng hợp báo cáo kho theo sản phẩm
 */
export const productSummary = async (req: Request, res: Response) => {
  try {
    const storeCd = req.query.storeCd as string | undefined;
    const fromDate = req.query.fromDate as string | undefined;
    const toDate = req.query.toDate as string | undefined;
    const date = req.query.date as string | undefined;
    const page = req.query.page ? Number(req.query.page) : undefined;
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined;
    const search = req.query.search as string | undefined;

    const result = await service.getProductReport({
      storeCd,
      fromDate,
      toDate,
      date,
      page,
      pageSize,
      search,
    });

    res.json({
      success: true,
      message: 'Lấy báo cáo sản phẩm thành công',
      data: result.data,
      total: result.total,
      summary: result.summary,
      filters: result.filters,
    });
  } catch (error: any) {
    console.error('Error getting product report:', error);
    res.status(500).json({
      success: false,
      message: 'Không thể lấy báo cáo sản phẩm',
      error: error.message || 'Lỗi không xác định',
    });
  }
};