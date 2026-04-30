import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, BeforeInsert } from 'typeorm';
import { AppDataSource } from '../data-source';
import { CodeGeneratorService } from '../services/code-generator.service';

/**
 * Export entity - Bảng phiếu xuất kho (TB_EXPORT)
 * 
 * Theo cấu trúc:
 * - ID: Khóa chính bigint
 * - EXPORT_CD: Mã phiếu xuất
 * - STORE_CD: Mã store (FK)
 * - EXPORT_DT: Ngày xuất
 * - NOTE: Ghi chú
 * - CREATED_DT: Ngày tạo
 * - CREATED_BY: Người tạo
 */
@Entity('TB_EXPORT')
export class Export {
    @PrimaryGeneratedColumn('increment')
    ID!: number; // ID phiếu xuất - Khóa chính bigint

    @Column({ type: 'varchar', length: 255, unique: true })
    EXPORT_CD!: string; // Mã phiếu xuất - Tự động tạo

    @Column({ type: 'varchar', length: 255 })
    STORE_CD!: string; // Mã store (FK)

    @Column({ type: 'datetime' })
    EXPORT_DT!: Date; // Ngày xuất

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
     * Tự động tạo mã EXPORT_CD trước khi insert
     * Format: EX0001, EX0002, ...
     */
    @BeforeInsert()
    async generateExportCode() {
        if (!this.EXPORT_CD) {
            const codeGenerator = new CodeGeneratorService(AppDataSource);
            this.EXPORT_CD = await codeGenerator.generateExportCode();
        }
    }
}