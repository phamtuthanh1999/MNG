import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, BeforeInsert } from 'typeorm';
import { AppDataSource } from '../data-source';
import { CodeGeneratorService } from '../services/code-generator.service';

/**
 * Comm entity - Bảng master common (TB_MST_COM)
 * 
 * Theo cấu trúc:
 * - ID: Khóa chính bigint  
 * - UN_CD: Mã đơn vị (unique)
 * - UN_NM: Tên đơn vị
 * - UN_TP: Loại đơn vị
 * - IS_ACTIVE: Trạng thái hoạt động
 * - DESCRIPTION: Mô tả
 * - REQ_DT: Ngày tạo
 * - REQ_ID: ID request
 */
@Entity('TB_MST_COM')
export class Comm {
    @PrimaryGeneratedColumn('increment')
    ID!: number; // ID đơn vị - Khóa chính bigint

    @Column({ type: 'varchar', length: 255, unique: true })
    UN_CD!: string; // Mã đơn vị - Tự động tạo

    @Column({ type: 'varchar', length: 255 })
    UN_NM!: string; // Tên đơn vị

    @Column({ type: 'varchar', length: 100, nullable: true })
    UN_TP!: string | null; // Loại đơn vị

    @Column({ type: 'boolean', default: true })
    IS_ACTIVE!: boolean; // Trạng thái hoạt động

    @Column({ type: 'text', nullable: true })
    DESCRIPTION!: string | null; // Mô tả

    @CreateDateColumn()
    REQ_DT!: Date; // Ngày tạo

    @Column({ type: 'varchar', length: 255, nullable: true })
    REQ_ID!: string | null; // ID request

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date; // Thời gian tạo bản ghi

    @Column({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
        onUpdate: 'CURRENT_TIMESTAMP'
    })
    updatedAt!: Date; // Thời gian cập nhật bản ghi

    /**
     * Tự động tạo mã UN_CD trước khi insert
     * Format: UN0001, UN0002, ...
     */
    @BeforeInsert()
    async generateUnitCode() {
        if (!this.UN_CD) {
            const codeGenerator = new CodeGeneratorService(AppDataSource);
            this.UN_CD = await codeGenerator.generateUnitCode();
        }
    }
}