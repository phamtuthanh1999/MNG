import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

/**
 * UserStore entity - Bảng liên kết user và store (TB_USER_STORE)
 * 
 * Theo cấu trúc:
 * - ID: Khóa chính bigint
 * - USER_CD: Mã user (FK)
 * - STORE_CD: Mã store (FK)
 * - ROLE_STORE: Vai trò tại store
 * - CREATED_DT: Ngày tạo
 * - CREATED_BY: Người tạo
 */
@Entity('TB_USER_STORE')
export class UserStore {
    @PrimaryGeneratedColumn('increment')
    ID!: number; // ID - Khóa chính bigint

    @Column({ type: 'varchar', length: 255 })
    USER_CD!: string; // Mã user (FK)

    @Column({ type: 'varchar', length: 255 })
    STORE_CD!: string; // Mã store (FK)

    @Column({ type: 'varchar', length: 100, nullable: true })
    ROLE_STORE!: string | null; // Vai trò tại store

    @CreateDateColumn()
    CREATED_DT!: Date; // Ngày tạo

    @Column({ type: 'varchar', length: 255, nullable: true })
    CREATED_BY!: string | null; // Người tạo
}