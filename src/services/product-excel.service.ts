import ExcelJS from 'exceljs';
import { AppDataSource } from '../data-source';
import { Product } from '../entity/Product';
import { CodeGeneratorService } from './code-generator.service';

const MAX_ROWS = 2000;
const BATCH_SIZE = 500;

const toExcelBuffer = (buffer: Buffer): ExcelJS.Buffer =>
  buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ExcelJS.Buffer;

interface ProductExcelRow {
  rowNum: number;
  PD_NM: string;
  STORE_ID: string;
  QUANTITY: number;
  UNIT_CD: string;
  DESCRIPTION: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

/**
 * Tạo file template Excel cho sản phẩm
 */
export const generateProductTemplate = async (): Promise<ExcelJS.Buffer> => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Sản phẩm');

  sheet.columns = [
    { header: 'Tên sản phẩm (PD_NM) *', key: 'PD_NM', width: 30 },
    { header: 'Cửa hàng (STORE_ID) *', key: 'STORE_ID', width: 20 },
    { header: 'Số lượng (QUANTITY) *', key: 'QUANTITY', width: 18 },
    { header: 'Đơn vị (UNIT_CD) *', key: 'UNIT_CD', width: 18 },
    { header: 'Mô tả (DESCRIPTION)', key: 'DESCRIPTION', width: 35 },
  ];

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2563EB' }, // blue-600
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  headerRow.height = 28;

  // Add sample row
  sheet.addRow({
    PD_NM: 'Sản phẩm mẫu',
    STORE_ID: 'CH001',
    QUANTITY: 100,
    UNIT_CD: 'CAI',
    DESCRIPTION: 'Mô tả sản phẩm mẫu',
  });

  // Add note row
  const noteRow = sheet.addRow({
    PD_NM: '⚠ Lưu ý: Cột có dấu * là bắt buộc. Tối đa 2000 dòng. Mã sản phẩm (PD_CD) sẽ được tự động tạo.',
  });
  noteRow.font = { italic: true, color: { argb: 'FFDC2626' } };

  // Data validation for QUANTITY (must be integer > 0)
  for (let i = 2; i <= MAX_ROWS + 1; i++) {
    sheet.getCell(`C${i}`).dataValidation = {
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
 * Parse và validate file Excel sản phẩm
 */
export const parseAndValidateProductExcel = async (
  buffer: Buffer
): Promise<{ rows: ProductExcelRow[]; errors: ValidationError[] }> => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(toExcelBuffer(buffer));

  const sheet = workbook.getWorksheet(1);
  if (!sheet) {
    return { rows: [], errors: [{ row: 0, field: '', message: 'File Excel không có sheet nào' }] };
  }

  const errors: ValidationError[] = [];
  const rows: ProductExcelRow[] = [];
  let dataRowCount = 0;

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header

    const pdNm = String(row.getCell(1).value ?? '').trim();
    const storeId = String(row.getCell(2).value ?? '').trim();
    const rawQty = row.getCell(3).value;
    const unitCd = String(row.getCell(4).value ?? '').trim();
    const description = String(row.getCell(5).value ?? '').trim();

    // Skip entirely empty rows
    if (!pdNm && !storeId && !rawQty && !unitCd) return;

    // Skip note/info rows
    if (pdNm.startsWith('⚠')) return;

    dataRowCount++;

    if (dataRowCount > MAX_ROWS) {
      if (dataRowCount === MAX_ROWS + 1) {
        errors.push({ row: rowNumber, field: '', message: `Vượt quá giới hạn ${MAX_ROWS} dòng sản phẩm` });
      }
      return;
    }

    // Validate PD_NM
    if (!pdNm) {
      errors.push({ row: rowNumber, field: 'PD_NM', message: 'Tên sản phẩm không được để trống' });
    }

    // Validate STORE_ID
    if (!storeId) {
      errors.push({ row: rowNumber, field: 'STORE_ID', message: 'Cửa hàng không được để trống' });
    }

    // Validate QUANTITY
    const quantity = Number(rawQty);
    if (!rawQty || isNaN(quantity) || !Number.isInteger(quantity) || quantity <= 0) {
      errors.push({ row: rowNumber, field: 'QUANTITY', message: 'Số lượng phải là số nguyên > 0' });
    }

    // Validate UNIT_CD
    if (!unitCd) {
      errors.push({ row: rowNumber, field: 'UNIT_CD', message: 'Đơn vị không được để trống' });
    }

    rows.push({
      rowNum: rowNumber,
      PD_NM: pdNm,
      STORE_ID: storeId,
      QUANTITY: quantity,
      UNIT_CD: unitCd,
      DESCRIPTION: description,
    });
  });

  if (dataRowCount === 0) {
    errors.push({ row: 0, field: '', message: 'File không có dữ liệu nào' });
  }

  return { rows, errors };
};

/**
 * Lưu sản phẩm từ Excel vào DB - batch insert với transaction
 */
export const saveProductsFromExcel = async (
  rows: ProductExcelRow[],
  userLogin: string
): Promise<Product[]> => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const codeGen = new CodeGeneratorService(AppDataSource);
    const savedProducts: Product[] = [];

    // Lấy số bắt đầu 1 lần, sau đó tự tăng để tránh duplicate
    const firstCode = await codeGen.generateProductCode();
    const prefix = 'SP';
    let nextNumber = parseInt(firstCode.substring(prefix.length), 10);

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const products: Product[] = [];

      for (const row of batch) {
        const pdCd = `${prefix}${nextNumber.toString().padStart(4, '0')}`;
        nextNumber++;
        const product = queryRunner.manager.create(Product, {
          PD_CD: pdCd,
          PD_NM: row.PD_NM,
          STORE_ID: row.STORE_ID,
          QUANTITY: row.QUANTITY,
          UNIT_CD: row.UNIT_CD,
          DESCRIPTION: row.DESCRIPTION || null,
          USER_LOGIN: userLogin,
          REQ_ID: userLogin,
        });
        products.push(product);
      }

      const saved = await queryRunner.manager.save(Product, products, { reload: false });
      savedProducts.push(...saved);
    }

    await queryRunner.commitTransaction();
    return savedProducts;
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
};
