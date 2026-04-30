import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

/**
 * ImportDetail entity - Bảng chi tiết phiếu nhập kho (TB_IMPORT_DETAIL)
 * 
 * Theo cấu trúc:
 * - ID: Khóa chính bigint
 * - IMPORT_ID: ID phiếu nhập (FK)
 * - PD_CD: Mã sản phẩm (FK)
 * - UNIT_CD: Mã đơn vị (FK)
 * - QUANTITY: Số lượng nhập
 * - PRICE: Giá nhập
 * - CREATED_DT: Ngày tạo
 */
@Entity('TB_IMPORT_DETAIL')
export class ImportDetail {
    @PrimaryGeneratedColumn('increment')
    ID!: number; // ID chi tiết - Khóa chính bigint

    @Column({ type: 'bigint' })
    IMPORT_ID!: number; // ID phiếu nhập (FK)

    @Column({ type: 'varchar', length: 255 })
    PD_CD!: string; // Mã sản phẩm (FK)

    @Column({ type: 'varchar', length: 255 })
    UNIT_CD!: string; // Mã đơn vị (FK)

    @Column({ type: 'int' })
    QUANTITY!: number; // Số lượng nhập

    @Column({ type: 'decimal', precision: 18, scale: 2 })
    PRICE!: number; // Giá nhập

    @CreateDateColumn()
    CREATED_DT!: Date; // Ngày tạo

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date; // Thời gian tạo bản ghi

    @Column({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
        onUpdate: 'CURRENT_TIMESTAMP'
    })
    updatedAt!: Date; // Thời gian cập nhật bản ghi
}