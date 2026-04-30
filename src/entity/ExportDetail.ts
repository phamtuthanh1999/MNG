import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

/**
 * ExportDetail entity - Bảng chi tiết phiếu xuất kho (TB_EXPORT_DETAIL)
 * 
 * Theo cấu trúc:
 * - ID: Khóa chính bigint
 * - EXPORT_ID: ID phiếu xuất (FK)
 * - PD_CD: Mã sản phẩm (FK)
 * - UNIT_CD: Mã đơn vị (FK)
 * - QUANTITY: Số lượng xuất
 * - CREATED_DT: Ngày tạo
 */
@Entity('TB_EXPORT_DETAIL')
export class ExportDetail {
    @PrimaryGeneratedColumn('increment')
    ID!: number; // ID chi tiết - Khóa chính bigint

    @Column({ type: 'bigint' })
    EXPORT_ID!: number; // ID phiếu xuất (FK)

    @Column({ type: 'varchar', length: 255 })
    PD_CD!: string; // Mã sản phẩm (FK)

    @Column({ type: 'varchar', length: 255 })
    UNIT_CD!: string; // Mã đơn vị (FK)

    @Column({ type: 'int' })
    QUANTITY!: number; // Số lượng xuất

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