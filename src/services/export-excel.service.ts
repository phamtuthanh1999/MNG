import ExcelJS from 'exceljs';
import { AppDataSource } from '../data-source';
import { Export } from '../entity/Export';
import { ExportDetail } from '../entity/ExportDetail';
import { getStockBalanceMap } from './stock-balance.service';

const MAX_ROWS = 2000;
const BATCH_SIZE = 500;

const toExcelBuffer = (buffer: Buffer): ExcelJS.Buffer =>
  buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ExcelJS.Buffer;

interface ExcelRow {
  rowNum: number;
  PD_CD: string;
  UNIT_CD: string;
  QUANTITY: number;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

/**
 * Tạo file template Excel cho xuất hàng
 */
export const generateTemplate = async (): Promise<ExcelJS.Buffer> => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Xuất hàng');

  sheet.columns = [
    { header: 'Mã sản phẩm (PD_CD) *', key: 'PD_CD', width: 22 },
    { header: 'Tên sản phẩm (tham khảo)', key: 'PD_NM', width: 30 },
    { header: 'Đơn vị (UNIT_CD) *', key: 'UNIT_CD', width: 18 },
    { header: 'Số lượng xuất (QUANTITY) *', key: 'QUANTITY', width: 20 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFEA580C' },
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  headerRow.height = 28;

  sheet.addRow({
    PD_CD: 'SP0001',
    PD_NM: 'Sản phẩm mẫu',
    UNIT_CD: 'CAI',
    QUANTITY: 10,
  });

  const noteRow = sheet.addRow({
    PD_CD: '⚠ Lưu ý: Cột có dấu * là bắt buộc. Tối đa 2000 dòng. Số lượng xuất sẽ được trừ vào tồn kho hiện tại.',
  });
  noteRow.font = { italic: true, color: { argb: 'FFDC2626' } };

  for (let i = 2; i <= MAX_ROWS + 1; i++) {
    sheet.getCell(`D${i}`).dataValidation = {
      type: 'whole',
      operator: 'greaterThan',
      formulae: [0],
      showErrorMessage: true,
      errorTitle: 'Lỗi',
      error: 'Số lượng phải là số nguyên > 0',
    };
  }

  return workbook.xlsx.writeBuffer();
};

/**
 * Parse và validate file Excel upload
 */
export const parseAndValidateExcel = async (
  buffer: Buffer
): Promise<{ rows: ExcelRow[]; errors: ValidationError[] }> => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(toExcelBuffer(buffer));

  const sheet = workbook.getWorksheet(1);
  if (!sheet) {
    return { rows: [], errors: [{ row: 0, field: '', message: 'File Excel không có sheet nào' }] };
  }

  const errors: ValidationError[] = [];
  const rows: ExcelRow[] = [];
  let dataRowCount = 0;

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const pdCd = String(row.getCell(1).value ?? '').trim();
    const unitCd = String(row.getCell(3).value ?? '').trim();
    const rawQty = row.getCell(4).value;

    if (!pdCd && !unitCd && !rawQty) return;
    if (pdCd.startsWith('⚠')) return;

    dataRowCount++;

    if (dataRowCount > MAX_ROWS) {
      if (dataRowCount === MAX_ROWS + 1) {
        errors.push({ row: rowNumber, field: '', message: `Vượt quá giới hạn ${MAX_ROWS} dòng sản phẩm` });
      }
      return;
    }

    if (!pdCd) {
      errors.push({ row: rowNumber, field: 'PD_CD', message: 'Mã sản phẩm không được để trống' });
    }

    if (!unitCd) {
      errors.push({ row: rowNumber, field: 'UNIT_CD', message: 'Đơn vị không được để trống' });
    }

    const quantity = Number(rawQty);
    if (!rawQty || isNaN(quantity) || !Number.isInteger(quantity) || quantity <= 0) {
      errors.push({ row: rowNumber, field: 'QUANTITY', message: 'Số lượng phải là số nguyên > 0' });
    }

    rows.push({
      rowNum: rowNumber,
      PD_CD: pdCd,
      UNIT_CD: unitCd,
      QUANTITY: quantity,
    });
  });

  if (dataRowCount === 0) {
    errors.push({ row: 0, field: '', message: 'File không có dữ liệu nào' });
  }

  return { rows, errors };
};

/**
 * Validate mã sản phẩm và tồn kho hiện tại
 */
export const validateProductCodesAndStock = async (
  rows: ExcelRow[]
): Promise<ValidationError[]> => {
  const errors: ValidationError[] = [];

  const uniqueCodes = [...new Set(rows.map((row) => row.PD_CD).filter(Boolean))];
  const stockMap = await getStockBalanceMap(uniqueCodes);
  const stockByCode = new Map<string, number>();

  for (const row of rows) {
    if (!row.PD_CD) continue;

    const stock = stockMap.get(row.PD_CD);
    if (!stock) {
      errors.push({
        row: row.rowNum,
        field: 'PD_CD',
        message: `Mã sản phẩm "${row.PD_CD}" không tồn tại trong hệ thống`,
      });
      continue;
    }

    stockByCode.set(row.PD_CD, (stockByCode.get(row.PD_CD) || 0) + row.QUANTITY);
  }

  for (const [code, quantity] of stockByCode.entries()) {
    const stock = stockMap.get(code);
    if (!stock) continue;
    if (quantity > stock.currentStock) {
      const relatedRows = rows.filter((row) => row.PD_CD === code);
      for (const row of relatedRows) {
        errors.push({
          row: row.rowNum,
          field: 'QUANTITY',
          message: `Tồn kho không đủ cho sản phẩm "${code}" (còn ${stock.currentStock})`,
        });
      }
    }
  }

  return errors;
};

/**
 * Lưu dữ liệu Excel vào DB - tạo phiếu xuất + chi tiết và trừ tồn kho
 */
export const saveExportFromExcel = async (
  rows: ExcelRow[],
  storeCd: string,
  exportDt: string,
  note: string | null,
  createdBy: string
): Promise<Export> => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const exportRecord = queryRunner.manager.create(Export, {
      STORE_CD: storeCd,
      EXPORT_DT: new Date(exportDt),
      NOTE: note || null,
      CREATED_BY: createdBy,
    });

    const savedExport = await queryRunner.manager.save(Export, exportRecord);

    const details = rows.map((row) =>
      queryRunner.manager.create(ExportDetail, {
        EXPORT_ID: savedExport.ID,
        PD_CD: row.PD_CD,
        UNIT_CD: row.UNIT_CD,
        QUANTITY: row.QUANTITY,
      })
    );

    for (let i = 0; i < details.length; i += BATCH_SIZE) {
      const batch = details.slice(i, i + BATCH_SIZE);
      await queryRunner.manager.save(ExportDetail, batch, { reload: false });
    }

    await queryRunner.commitTransaction();
    return savedExport;
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
};