import { In } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Export } from '../entity/Export';
import { ExportDetail } from '../entity/ExportDetail';
import { Import } from '../entity/Import';
import { ImportDetail } from '../entity/ImportDetail';
import { Product } from '../entity/Product';

export interface StockBalanceSnapshot {
  openingStock: number;
  importQty: number;
  exportQty: number;
  currentStock: number;
}

const normalizeCodes = (codes: string[]) => [...new Set(codes.map((code) => code.trim()).filter(Boolean))];

const toNumberMap = <T extends { pdCd: string; total: string | number | null }>(rows: T[]) => {
  const map = new Map<string, number>();

  for (const row of rows) {
    map.set(row.pdCd, Number(row.total) || 0);
  }

  return map;
};

export const getStockBalanceMap = async (codes: string[]): Promise<Map<string, StockBalanceSnapshot>> => {
  const uniqueCodes = normalizeCodes(codes);
  const result = new Map<string, StockBalanceSnapshot>();

  if (uniqueCodes.length === 0) {
    return result;
  }

  const productRepo = AppDataSource.getRepository(Product);
  const importDetailRepo = AppDataSource.getRepository(ImportDetail);
  const exportDetailRepo = AppDataSource.getRepository(ExportDetail);

  const [products, importRows, exportRows] = await Promise.all([
    productRepo.find({
      where: { PD_CD: In(uniqueCodes) },
      select: ['PD_CD', 'QUANTITY'],
    }),
    importDetailRepo
      .createQueryBuilder('detail')
      .innerJoin(Import, 'header', 'header.ID = detail.IMPORT_ID')
      .select('detail.PD_CD', 'pdCd')
      .addSelect('SUM(detail.QUANTITY)', 'total')
      .where('detail.PD_CD IN (:...codes)', { codes: uniqueCodes })
      .groupBy('detail.PD_CD')
      .getRawMany<{ pdCd: string; total: string }>(),
    exportDetailRepo
      .createQueryBuilder('detail')
      .innerJoin(Export, 'header', 'header.ID = detail.EXPORT_ID')
      .select('detail.PD_CD', 'pdCd')
      .addSelect('SUM(detail.QUANTITY)', 'total')
      .where('detail.PD_CD IN (:...codes)', { codes: uniqueCodes })
      .groupBy('detail.PD_CD')
      .getRawMany<{ pdCd: string; total: string }>(),
  ]);

  const importMap = toNumberMap(importRows);
  const exportMap = toNumberMap(exportRows);

  for (const product of products) {
    const openingStock = Number(product.QUANTITY) || 0;
    const importQty = importMap.get(product.PD_CD) || 0;
    const exportQty = exportMap.get(product.PD_CD) || 0;

    result.set(product.PD_CD, {
      openingStock,
      importQty,
      exportQty,
      currentStock: openingStock + importQty - exportQty,
    });
  }

  return result;
};