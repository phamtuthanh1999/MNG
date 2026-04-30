import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, BeforeInsert } from 'typeorm';
import { AppDataSource } from '../data-source';
import { CodeGeneratorService } from '../services/code-generator.service';

/**
 * Product entity - Bảng sản phẩm (TB_PRODUCT)
 * 
 * Theo cấu trúc:
 * - ID: Khóa chính bigint
 * - PD_CD: Mã sản phẩm (unique)
 * - PD_NM: Tên sản phẩm
 * - STORE_ID: ID cửa hàng
 * - QUANTITY: Số lượng
 * - UNIT_CD: Mã đơn vị (FK)
 * - DESCRIPTION: Mô tả sản phẩm
 * - IMG_URL: Link ảnh sản phẩm
 * - USER_LOGIN: Người tạo/cập nhật
 * - REQ_DT: Ngày tạo/cập nhật
 * - REQ_ID: ID request/transaction
 */
@Entity('TB_PRODUCT')
export class Product {
    @PrimaryGeneratedColumn('increment')
    ID!: number; // ID sản phẩm - Khóa chính bigint

    @Column({ type: 'varchar', length: 255, unique: true })
    PD_CD!: string; // Mã sản phẩm - Tự động tạo

    @Column({ type: 'varchar', length: 255 })
    PD_NM!: string; // Tên sản phẩm

    @Column({ type: 'varchar', length: 255, nullable: true })
    STORE_ID!: string | null; // Tên cửa hàng

    @Column({ type: 'int', default: 0 })
    QUANTITY!: number; // Số lượng

    @Column({ type: 'varchar', length: 255, nullable: true })
    UNIT_CD!: string | null; // Mã đơn vị (FK - liên kết TB_UNIT.UN_CD)

    @Column({ type: 'text', nullable: true })
    DESCRIPTION!: string | null; // Mô tả sản phẩm

    @Column({ type: 'varchar', length: 500, nullable: true })
    IMG_URL!: string | null; // Link ảnh sản phẩm

    @Column({ type: 'varchar', length: 255, nullable: true })
    USER_LOGIN!: string | null; // Người tạo/cập nhật

    @CreateDateColumn()
    REQ_DT!: Date; // Ngày tạo/cập nhật

    @Column({ type: 'varchar', length: 255, nullable: true })
    REQ_ID!: string | null; // ID request/transaction
    

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date; // Thời gian tạo bản ghi


    @Column({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
        onUpdate: 'CURRENT_TIMESTAMP',
    })
    updatedAt!: Date; // Thời gian cập nhật bản ghi

    /**
     * Tự động tạo mã PD_CD trước khi insert
     * Format: SP001, SP1001...
     */
    @BeforeInsert()
    async generateProductCode() {
        if (!this.PD_CD) {
            const codeGenerator = new CodeGeneratorService(AppDataSource);
            this.PD_CD = await codeGenerator.generateProductCode();
        }
    }

}
