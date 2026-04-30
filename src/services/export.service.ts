import { Brackets } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Export } from '../entity/Export';
import { ExportDetail } from '../entity/ExportDetail';
import { getStockBalanceMap } from './stock-balance.service';

interface SearchExportParams {
  keyword?: string;
  storeCd?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

// Helper để truy cập Export repository
const exportRepo = () => AppDataSource.getRepository(Export);
const exportDetailRepo = () => AppDataSource.getRepository(ExportDetail);

/**
 * Tạo phiếu xuất mới
 * Create and persist a new export
 */
export const createExport = async (data: Partial<Export>) => {
  const repo = exportRepo();
  const exportRecord = repo.create(data);
  return repo.save(exportRecord);
};

/**
 * Lấy danh sách tất cả phiếu xuất
 * List all exports
 */
export const listExports = async () => {
  return exportRepo().find({
    order: { ID: 'DESC' }
  });
};

/**
 * Lấy thông tin phiếu xuất theo ID
 * Get a single export by ID
 */
export const getExport = async (id: number) => {
  return exportRepo().findOne({
    where: { ID: id }
  });
};

/**
 * Lấy phiếu xuất theo mã phiếu xuất (EXPORT_CD)
 * Get export by export code
 */
export const getExportByCode = async (exportCode: string) => {
  return exportRepo().findOne({
    where: { EXPORT_CD: exportCode }
  });
};

/**
 * Cập nhật thông tin phiếu xuất
 * Update export fields and return the updated entity
 */
export const updateExport = async (id: number, data: Partial<Export>) => {
  const repo = exportRepo();
  await repo.update(id, data);
  return getExport(id);
};

/**
 * Xóa phiếu xuất
 * Remove export and return the count
 */
export const removeExport = async (id: number) => {
  const result = await exportRepo().delete(id);
  return { affected: result.affected };
};

/**
 * Tìm kiếm phiếu xuất theo bộ lọc
 * Search exports by filters
 */
export const searchExports = async (params: SearchExportParams) => {

  const keyword = params.keyword?.trim();
  const storeCd = params.storeCd?.trim();
  const fromDate = params.fromDate?.trim();
  const toDate = params.toDate?.trim();
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 10));

  const query = exportRepo()
    .createQueryBuilder('export')
    .orderBy('export.ID', 'DESC');

  if (keyword) {
    query.andWhere(
      new Brackets((subQuery) => {
        subQuery
          .where('export.EXPORT_CD LIKE :keyword', { keyword: `%${keyword}%` })
          .orWhere('export.NOTE LIKE :keyword', { keyword: `%${keyword}%` })
          .orWhere('export.CREATED_BY LIKE :keyword', { keyword: `%${keyword}%` })
          .orWhere('export.STORE_CD LIKE :keyword', { keyword: `%${keyword}%` });
      })
    );
  }

  if (storeCd) {
    query.andWhere('export.STORE_CD = :storeCd', { storeCd });
  }

  if (fromDate) {
    query.andWhere('DATE(export.EXPORT_DT) >= :fromDate', { fromDate });
  }

  if (toDate) {
    query.andWhere('DATE(export.EXPORT_DT) <= :toDate', { toDate });
  }

  const total = await query.getCount();
  const data = await query
    .skip((page - 1) * pageSize)
    .take(pageSize)
    .getMany();

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
};

// ------- EXPORT DETAIL SERVICES -------

/**
 * Tạo chi tiết phiếu xuất mới
 * Create and persist a new export detail
 */
export const createExportDetail = async (data: Partial<ExportDetail>) => {
  const repo = exportDetailRepo();
  const productCode = String(data.PD_CD || '').trim();
  const quantity = Number(data.QUANTITY) || 0;

  if (!productCode) {
    throw new Error('Mã sản phẩm không được để trống');
  }

  if (quantity <= 0) {
    throw new Error('Số lượng xuất phải lớn hơn 0');
  }

  const stockMap = await getStockBalanceMap([productCode]);
  const stock = stockMap.get(productCode);

  if (!stock) {
    throw new Error(`Không tìm thấy sản phẩm ${productCode}`);
  }

  if (quantity > stock.currentStock) {
    throw new Error(`Tồn kho không đủ cho sản phẩm ${productCode} (còn ${stock.currentStock})`);
  }

  const exportDetail = repo.create(data);
  return repo.save(exportDetail);
};

/**
 * Lấy danh sách tất cả chi tiết phiếu xuất theo EXPORT_ID
 * List all export details by export ID
 */
export const listExportDetailsByExportId = async (exportId: number) => {
  const sql = `
    SELECT
      ed.ID,
      ed.EXPORT_ID,
      e.EXPORT_CD,
      p.PD_CD,
      p.PD_NM,
      p.UNIT_CD,
      ed.QUANTITY,
      COALESCE(i.IMPORT_QTY, 0) + COALESCE(p.QUANTITY, 0) - COALESCE(x.EXPORT_QTY, 0) AS STOCK_QUANTITY,
      ed.CREATED_DT,
      ed.createdAt,
      ed.updatedAt
    FROM TB_EXPORT_DETAIL ed
    JOIN TB_EXPORT e
      ON ed.EXPORT_ID = e.ID
    JOIN TB_PRODUCT p
      ON ed.PD_CD = p.PD_CD
    LEFT JOIN (
      SELECT PD_CD, COALESCE(SUM(QUANTITY), 0) AS IMPORT_QTY
      FROM TB_IMPORT_DETAIL
      GROUP BY PD_CD
    ) i
      ON i.PD_CD = p.PD_CD
    LEFT JOIN (
      SELECT PD_CD, COALESCE(SUM(QUANTITY), 0) AS EXPORT_QTY
      FROM TB_EXPORT_DETAIL
      GROUP BY PD_CD
    ) x
      ON x.PD_CD = p.PD_CD
    WHERE e.ID = ?
    ORDER BY ed.ID ASC
  `;

  return AppDataSource.query(sql, [exportId]);
};

/**
 * Lấy chi tiết phiếu xuất theo ID
 * Get export detail by ID
 */
export const getExportDetail = async (id: number) => {
  return exportDetailRepo().findOne({
    where: { ID: id }
  });
};

/**
 * Cập nhật chi tiết phiếu xuất
 * Update export detail
 */
export const updateExportDetail = async (id: number, data: Partial<ExportDetail>) => {
  const repo = exportDetailRepo();
  const current = await repo.findOne({ where: { ID: id } });

  if (!current) {
    return null;
  }

  const nextProductCode = String(data.PD_CD || current.PD_CD || '').trim();
  const nextQuantity = Number(data.QUANTITY ?? current.QUANTITY) || 0;

  if (!nextProductCode) {
    throw new Error('Mã sản phẩm không được để trống');
  }

  if (nextQuantity <= 0) {
    throw new Error('Số lượng xuất phải lớn hơn 0');
  }

  const stockMap = await getStockBalanceMap([current.PD_CD, nextProductCode]);
  const nextStock = stockMap.get(nextProductCode);

  if (!nextStock) {
    throw new Error(`Không tìm thấy sản phẩm ${nextProductCode}`);
  }

  const allowedStock = nextProductCode === current.PD_CD
    ? nextStock.currentStock + (Number(current.QUANTITY) || 0)
    : nextStock.currentStock;

  if (nextQuantity > allowedStock) {
    throw new Error(`Tồn kho không đủ cho sản phẩm ${nextProductCode} (còn ${allowedStock})`);
  }

  await repo.update(id, data);
  return getExportDetail(id);
};

/**
 * Xóa chi tiết phiếu xuất
 * Remove export detail
 */
export const removeExportDetail = async (id: number) => {
  const result = await exportDetailRepo().delete(id);
  return { affected: result.affected };
};

/**
 * Lấy danh sách chi tiết phiếu xuất theo sản phẩm
 * Get export details by product code
 */
export const getExportDetailsByProductCode = async (productCode: string) => {
  return exportDetailRepo().find({
    where: { PD_CD: productCode },
    order: { CREATED_DT: 'DESC' }
  });
};