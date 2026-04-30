import { AppDataSource } from '../data-source';
import { Product } from '../entity/Product';
import { Import } from '../entity/Import';
import { ImportDetail } from '../entity/ImportDetail';
import { Export } from '../entity/Export';
import { ExportDetail } from '../entity/ExportDetail';

interface ReportParams {
  storeCd?: string;
  fromDate?: string;
  toDate?: string;
  date?: string; // single date snapshot (overrides fromDate/toDate behavior)
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface ProductReportRow {
  REPORT_DATE: string;
  PD_CD: string;
  PD_NM: string;
  UNIT_CD: string;
  STORE_ID: string | null;
  OPENING_STOCK: number;
  CLOSING_STOCK: number;
  IMPORT_QTY: number;
  EXPORT_QTY: number;
  IMPORT_MONEY: number;
  EXPORT_MONEY: number;
  CURRENT_STOCK: number;
  IMPORT_QTY_BEFORE: number;
  EXPORT_QTY_BEFORE: number;
  IMPORT_MONEY_TO_DATE: number;
  AVERAGE_IMPORT_PRICE: number;
  NOTE: string;
  AMOUNT: number;
}

export interface ProductReportSummary {
  openingStock: number;
  closingStock: number;
  importQty: number;
  exportQty: number;
  importMoney: number;
  exportMoney: number;
}

export interface ProductReportResponse {
  data: ProductReportRow[];
  total: number;
  summary: ProductReportSummary;
  filters: {
    storeCd: string;
    fromDate: string;
    toDate: string;
  };
}

interface MovementRow {
  pdCd: string;
  quantity: number;
  money: number;
  movementDate: Date;
}

interface ProductBalanceRow {
  pdCd: string;
  importBefore: number;
  exportBefore: number;
  importInPeriod: number;
  exportInPeriod: number;
  importMoneyToDate: number;
}

const normalizeDate = (value: string | undefined, fallback: Date) => {
  if (!value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed;
};

export const getProductReport = async (params: ReportParams): Promise<ProductReportResponse> => {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(1000, Math.max(1, params.pageSize || 20));
  const offset = (page - 1) * pageSize;
  const search = params.search?.trim() || '';

  const baseSql = `
    WITH TEMP_EXPORT AS (
      SELECT PD_CD, COALESCE(SUM(QUANTITY),0) AS QUANTITY
      FROM TB_EXPORT_DETAIL
      GROUP BY PD_CD
    ), TEMP_PRODUCT AS (
      SELECT * FROM TB_PRODUCT
    ), TEMP_IMPORT_DETAIL AS (
      SELECT PD_CD, COALESCE(SUM(QUANTITY),0) AS QUANTITY
      FROM TB_IMPORT_DETAIL
      GROUP BY PD_CD
    )
    SELECT product.PD_CD AS PD_CD,
           product.PD_NM AS PD_NM,
           product.UNIT_CD AS UNIT_CD,
           COALESCE(product.QUANTITY,0) AS PRODUCT_QUANTITY,
           COALESCE(texp.QUANTITY,0) AS EXPORTED_QUANTITY,
           COALESCE(timp.QUANTITY,0) AS IMPORT_QUANTITY,
           (COALESCE(timp.QUANTITY,0) + COALESCE(product.QUANTITY,0) - COALESCE(texp.QUANTITY,0)) AS STOCK_QUANTITY,
           product.DESCRIPTION AS NOTE
    FROM TEMP_PRODUCT product
    LEFT JOIN TEMP_EXPORT texp ON product.PD_CD = texp.PD_CD
    LEFT JOIN TEMP_IMPORT_DETAIL timp ON product.PD_CD = timp.PD_CD
  `;

  const paramsArr: any[] = [];
  let whereClause = '';
  if (search) {
    whereClause = `WHERE (product.PD_CD LIKE ? OR product.PD_NM LIKE ?)`;
    const like = `%${search}%`;
    paramsArr.push(like, like);
  }

  const countSql = `SELECT COUNT(*) AS total FROM (${baseSql} ${whereClause}) AS sub`;
  const countRes = await AppDataSource.query(countSql, paramsArr);
  const total = Number(countRes?.[0]?.total || 0);

  const pageSql = `${baseSql} ${whereClause} ORDER BY product.PD_CD ASC LIMIT ? OFFSET ?`;
  const pageParams = paramsArr.concat([pageSize, offset]);
  const dataRows: any[] = await AppDataSource.query(pageSql, pageParams);

  const rows = dataRows.map((r: any) => ({
    REPORT_DATE: new Date().toISOString().slice(0,10),
    PD_CD: r.PD_CD,
    PD_NM: r.PD_NM,
    UNIT_CD: r.UNIT_CD,
    STORE_ID: null,
    NOTE: r.NOTE || '',
    OPENING_STOCK: Number(r.PRODUCT_QUANTITY) || 0,
    CLOSING_STOCK: Number(r.STOCK_QUANTITY) || 0,
    IMPORT_QTY: Number(r.IMPORT_QUANTITY) || 0,
    EXPORT_QTY: Number(r.EXPORTED_QUANTITY) || 0,
    IMPORT_MONEY: 0,
    EXPORT_MONEY: 0,
    CURRENT_STOCK: Number(r.STOCK_QUANTITY) || 0,
    IMPORT_QTY_BEFORE: 0,
    EXPORT_QTY_BEFORE: 0,
    IMPORT_MONEY_TO_DATE: 0,
    AVERAGE_IMPORT_PRICE: 0,
    AMOUNT: 0,
  }));

  const summary = rows.reduce<ProductReportSummary>(
    (acc, row) => ({
      openingStock: acc.openingStock + row.OPENING_STOCK,
      closingStock: acc.closingStock + row.CLOSING_STOCK,
      importQty: acc.importQty + row.IMPORT_QTY,
      exportQty: acc.exportQty + row.EXPORT_QTY,
      importMoney: acc.importMoney + row.IMPORT_MONEY,
      exportMoney: acc.exportMoney + row.EXPORT_MONEY,
    }),
    { openingStock:0, closingStock:0, importQty:0, exportQty:0, importMoney:0, exportMoney:0 }
  );

  return {
    data: rows,
    total,
    summary,
    filters: { storeCd: params.storeCd || '', fromDate: params.date || '', toDate: params.date || '' },
  };
};