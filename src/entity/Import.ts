import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, BeforeInsert } from 'typeorm';
import { AppDataSource } from '../data-source';
import { CodeGeneratorService } from '../services/code-generator.service';

/**
 * Import entity - Bảng phiếu nhập kho (TB_IMPORT)
 * 
 * Theo cấu trúc:
 * - ID: Khóa chính bigint
 * - IMPORT_CD: Mã phiếu nhập
 * - STORE_CD: Mã store (FK)
 * - IMPORT_DT: Ngày nhập
 * - NOTE: Ghi chú
 * - CREATED_DT: Ngày tạo
 * - CREATED_BY: Người tạo
 */
@Entity('TB_IMPORT')
export class Import {
    @PrimaryGeneratedColumn('increment')
    ID!: number; // ID phiếu nhập - Khóa chính bigint

    @Column({ type: 'varchar', length: 255, unique: true })
    IMPORT_CD!: string; // Mã phiếu nhập - Tự động tạo

    @Column({ type: 'varchar', length: 255 })
    STORE_CD!: string; // Mã store (FK)

    @Column({ type: 'datetime' })
    IMPORT_DT!: Date; // Ngày nhập

    @Column({ type: 'varchar', length: 500, nullable: true })
    NOTE!: string | null; // Ghi chú

    @CreateDateColumn()
    CREATED_DT!: Date; // Ngày tạo

    @Column({ type: 'varchar', length: 255 })
    CREATED_BY!: string; // Người tạo

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date; // Thời gian tạo bản ghi

    @Column({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
        onUpdate: 'CURRENT_TIMESTAMP'
    })
    updatedAt!: Date; // Thời gian cập nhật bản ghi

    /**
     * Tự động tạo mã IMPORT_CD trước khi insert
     * Format: IM0001, IM0002, ...
     */
    @BeforeInsert()
    async generateImportCode() {
        if (!this.IMPORT_CD) {
            const codeGenerator = new CodeGeneratorService(AppDataSource);
            this.IMPORT_CD = await codeGenerator.generateImportCode();
        }
    }
}