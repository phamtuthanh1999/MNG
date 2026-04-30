import ExcelJS from 'exceljs';
import { AppDataSource } from '../data-source';
import { Product } from '../entity/Product';
import { Import } from '../entity/Import';
import { ImportDetail } from '../entity/ImportDetail';
import { CodeGeneratorService } from './code-generator.service';
import { In } from 'typeorm';

const MAX_ROWS = 2000;
const BATCH_SIZE = 500;

const toExcelBuffer = (buffer: Buffer): ExcelJS.Buffer =>
  buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ExcelJS.Buffer;

interface ExcelRow {
  rowNum: number;
  PD_CD: string;
  UNIT_CD: string;
  QUANTITY: number;
  PRICE: number;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

/**
 * Tạo file template Excel cho import
 */
export const generateTemplate = async (): Promise<ExcelJS.Buffer> => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Nhập hàng');

  // Header columns
  sheet.columns = [
    { header: 'Mã sản phẩm (PD_CD) *', key: 'PD_CD', width: 22 },
    { header: 'Tên sản phẩm (tham khảo)', key: 'PD_NM', width: 30 },
    { header: 'Đơn vị (UNIT_CD) *', key: 'UNIT_CD', width: 18 },
    { header: 'Số lượng (QUANTITY) *', key: 'QUANTITY', width: 20 },
    { header: 'Giá nhập (PRICE) *', key: 'PRICE', width: 20 },
  ];

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFEA580C' }, // orange-600
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  headerRow.height = 28;

  // Add sample row
  sheet.addRow({
    PD_CD: 'PD0001',
    PD_NM: 'Sản phẩm mẫu',
    UNIT_CD: 'CAI',
    QUANTITY: 100,
    PRICE: 50000,
  });

  // Add note row
  const noteRow = sheet.addRow({
    PD_CD: '⚠ Lưu ý: Cột có dấu * là bắt buộc. Tối đa 2000 dòng. Cột "Tên sản phẩm" chỉ để tham khảo, không lưu.',
  });
  noteRow.font = { italic: true, color: { argb: 'FFDC2626' } };

  // Data validation for QUANTITY (must be integer > 0)
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
    if (rowNumber === 1) return; // Skip header

    const pdCd = String(row.getCell(1).value ?? '').trim();
    const unitCd = String(row.getCell(3).value ?? '').trim();
    const rawQty = row.getCell(4).value;
    const rawPrice = row.getCell(5).value;

    // Skip entirely empty rows
    if (!pdCd && !unitCd && !rawQty && !rawPrice) return;

    // Skip note/info rows (start with special chars)
    if (pdCd.startsWith('⚠')) return;

    dataRowCount++;

    if (dataRowCount > MAX_ROWS) {
      if (dataRowCount === MAX_ROWS + 1) {
        errors.push({ row: rowNumber, field: '', message: `Vượt quá giới hạn ${MAX_ROWS} dòng sản phẩm` });
      }
      return;
    }

    // Validate PD_CD
    if (!pdCd) {
      errors.push({ row: rowNumber, field: 'PD_CD', message: 'Mã sản phẩm không được để trống' });
    }

    // Validate UNIT_CD
    if (!unitCd) {
      errors.push({ row: rowNumber, field: 'UNIT_CD', message: 'Đơn vị không được để trống' });
    }

    // Validate QUANTITY
    const quantity = Number(rawQty);
    if (!rawQty || isNaN(quantity) || !Number.isInteger(quantity) || quantity <= 0) {
      errors.push({ row: rowNumber, field: 'QUANTITY', message: 'Số lượng phải là số nguyên > 0' });
    }

    // Validate PRICE
    const price = Number(rawPrice);
    if (rawPrice === null || rawPrice === undefined || rawPrice === '' || isNaN(price) || price < 0) {
      errors.push({ row: rowNumber, field: 'PRICE', message: 'Giá nhập phải là số >= 0' });
    }

    rows.push({
      rowNum: rowNumber,
      PD_CD: pdCd,
      UNIT_CD: unitCd,
      QUANTITY: quantity,
      PRICE: price,
    });
  });

  if (dataRowCount === 0) {
    errors.push({ row: 0, field: '', message: 'File không có dữ liệu nào' });
  }

  return { rows, errors };
};

/**
 * Validate mã sản phẩm tồn tại trong DB
 */
export const validateProductCodes = async (
  rows: ExcelRow[]
): Promise<ValidationError[]> => {
  const errors: ValidationError[] = [];
  const productRepo = AppDataSource.getRepository(Product);

  // Collect unique PD_CD
  const uniqueCodes = [...new Set(rows.map((r) => r.PD_CD).filter(Boolean))];

  // Batch query to find existing products
  const existingProducts = await productRepo.find({
    where: { PD_CD: In(uniqueCodes) },
    select: ['PD_CD'],
  });

  const existingSet = new Set(existingProducts.map((p) => p.PD_CD));

  for (const row of rows) {
    if (row.PD_CD && !existingSet.has(row.PD_CD)) {
      errors.push({
        row: row.rowNum,
        field: 'PD_CD',
        message: `Mã sản phẩm "${row.PD_CD}" không tồn tại trong hệ thống`,
      });
    }
  }

  return errors;
};

/**
 * Lưu dữ liệu Excel vào DB - tạo phiếu nhập + chi tiết
 */
export const saveImportFromExcel = async (
  rows: ExcelRow[],
  storeCd: string,
  importDt: string,
  note: string | null,
  createdBy: string
): Promise<Import> => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // Generate import code
    const codeGen = new CodeGeneratorService(AppDataSource);
    const importCd = await codeGen.generateNextCode('TB_IMPORT', 'IMPORT_CD', 'IM', 4);

    // Create import header
    const importRecord = queryRunner.manager.create(Import, {
      IMPORT_CD: importCd,
      STORE_CD: storeCd,
      IMPORT_DT: new Date(importDt),
      NOTE: note || null,
      CREATED_BY: createdBy,
    });

    const savedImport = await queryRunner.manager.save(Import, importRecord);

    // Batch insert details
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const details = batch.map((row) =>
        queryRunner.manager.create(ImportDetail, {
          IMPORT_ID: savedImport.ID,
          PD_CD: row.PD_CD,
          UNIT_CD: row.UNIT_CD,
          QUANTITY: row.QUANTITY,
          PRICE: row.PRICE,
        })
      );
      await queryRunner.manager.save(ImportDetail, details, { reload: false });
    }

    await queryRunner.commitTransaction();
    return savedImport;
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
};
