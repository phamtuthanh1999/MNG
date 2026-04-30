import { DataSource } from 'typeorm';

/**
 * Code Generator Service - Tự động tạo mã cho các trường *_CD
 * 
 * Quy ước format:
 * - Product: PD0001, PD0002, ...
 * - Store: ST0001, ST0002, ...
 * - Import: IM0001, IM0002, ...
 * - Export: EX0001, EX0002, ...
 * - Unit: UN0001, UN0002, ...
 * - User: US0001, US0002, ...
 */
export class CodeGeneratorService {
    private dataSource: DataSource;

    constructor(dataSource: DataSource) {
        this.dataSource = dataSource;
    }

    /**
     * Tự động tạo mã code tiếp theo cho entity
     * @param entityName - Tên entity (TB_PRODUCT, TB_STORE, ...)
     * @param codeField - Tên trường code (PD_CD, STORE_CD, ...)
     * @param prefix - Tiền tố (PD, ST, IM, EX, UN, US, SP...)
     * @param padding - Quy định số chữ số được đệm thêm (mặc định bằng 4)
     * @returns Mã code mới (VD: PD0001)
     */
    async generateNextCode(entityName: string, codeField: string, prefix: string, padding: number = 4): Promise<string> {
        try {
            // Lấy mã code lớn nhất hiện tại (dùng CAST numeric để sort đúng)
            const query = `
                SELECT ${codeField} as code 
                FROM ${entityName} 
                WHERE ${codeField} LIKE '${prefix}%' 
                ORDER BY CAST(SUBSTRING(${codeField}, ${prefix.length + 1}) AS UNSIGNED) DESC 
                LIMIT 1
            `;
            
            const result = await this.dataSource.query(query);
            
            let nextNumber = 1;
            
            if (result && result.length > 0) {
                // Lấy số từ mã code hiện tại (VD: PD0001 -> 0001)
                const currentCode = result[0].code;
                const numberPart = currentCode.substring(prefix.length);
                const currentNumber = parseInt(numberPart, 10);
                nextNumber = currentNumber + 1;
            }
            
            // Format số thành chữ số theo padding
            const formattedNumber = nextNumber.toString().padStart(padding, '0');
            
            return `${prefix}${formattedNumber}`;
        } catch (error) {
            console.error(`Error generating code for ${entityName}:`, error);
            // Fallback: tạo mã với timestamp
            const timestamp = Date.now().toString().slice(-padding);
            return `${prefix}${timestamp}`;
        }
    }

    /**
     * Tạo mã cho Product (PD_CD)
     * @returns Mã sản phẩm mới (VD: SP001, SP1001)
     */
    async generateProductCode(): Promise<string> {
        return this.generateNextCode('TB_PRODUCT', 'PD_CD', 'SP', 4);
    }

    /**
     * Tạo mã cho Store (STORE_CD)  
     * @returns Mã store mới (VD: ST0001)
     */
    async generateStoreCode(): Promise<string> {
        return this.generateNextCode('TB_STORE', 'STORE_CD', 'ST');
    }

    /**
     * Tạo mã cho Import (IMPORT_CD)
     * @returns Mã phiếu nhập mới (VD: IM0001)
     */
    async generateImportCode(): Promise<string> {
        return this.generateNextCode('TB_IMPORT', 'IMPORT_CD', 'IM');
    }

    /**
     * Tạo mã cho Export (EXPORT_CD)
     * @returns Mã phiếu xuất mới (VD: EX0001)
     */
    async generateExportCode(): Promise<string> {
        return this.generateNextCode('TB_EXPORT', 'EXPORT_CD', 'EX');
    }

    /**
     * Tạo mã cho Unit/Comm (UN_CD)
     * @returns Mã đơn vị mới (VD: UN0001)
     */
    async generateUnitCode(): Promise<string> {
        return this.generateNextCode('TB_MST_COM', 'UN_CD', 'UN');
    }

    /**
     * Tạo mã cho User (USER_CD)
     * @returns Mã người dùng mới (VD: US0001)
     */
    async generateUserCode(): Promise<string> {
        return this.generateNextCode('TB_USER', 'USER_CD', 'US');
    }
}