import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, BeforeInsert } from 'typeorm';
import { AppDataSource } from '../data-source';
import { CodeGeneratorService } from '../services/code-generator.service';

/**
 * User entity - Bảng người dùng (TB_USER)
 * 
 * Theo cấu trúc:
 * - ID: Khóa chính bigint
 * - USER_CD: Mã người dùng (unique)
 * - USERNAME: Tên đăng nhập (unique)
 * - PASSWORD: Mật khẩu (đã hash)
 * - FULL_NAME: Họ và tên
 * - EMAIL: Email
 * - PHONE: Số điện thoại
 * - ROLE_CD: Quyền (ADMIN/STAFF/USER)
 * - IS_ACTIVE: Trạng thái hoạt động
 * - CREATED_DT: Ngày tạo
 * - CREATED_BY: Người tạo
 */
@Entity('TB_USER')
export class User {
    @PrimaryGeneratedColumn('increment')
    ID!: number; // ID người dùng - Khóa chính bigint

    @Column({ type: 'varchar', length: 255, unique: true })
    USER_CD!: string; // Mã người dùng - Tự động tạo

    @Column({ type: 'varchar', length: 255, unique: true })
    USERNAME!: string; // Tên đăng nhập - Unique

    @Column({ type: 'varchar', length: 255 })
    PASSWORD!: string; // Mật khẩu (đã hash)

    @Column({ type: 'varchar', length: 255, nullable: true })
    FULL_NAME!: string | null; // Họ và tên

    @Column({ type: 'varchar', length: 255, nullable: true })
    EMAIL!: string | null; // Email

    @Column({ type: 'varchar', length: 20, nullable: true })
    PHONE!: string | null; // Số điện thoại

    @Column({ type: 'varchar', length: 20, default: 'USER' })
    ROLE_CD!: string; // Quyền (ADMIN/STAFF/USER)

    @Column({ type: 'boolean', default: true })
    IS_ACTIVE!: boolean; // Trạng thái hoạt động

    @CreateDateColumn()
    CREATED_DT!: Date; // Ngày tạo

    @Column({ type: 'varchar', length: 255, nullable: true })
    CREATED_BY!: string | null; // Người tạo

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date; // Thời gian tạo bản ghi

    @Column({
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
        onUpdate: 'CURRENT_TIMESTAMP'
    })
    updatedAt!: Date; // Thời gian cập nhật bản ghi

    /**
     * Tự động tạo mã USER_CD trước khi insert
     * Format: US0001, US0002, ...
     */
    @BeforeInsert()
    async generateUserCode() {
        if (!this.USER_CD) {
            const codeGenerator = new CodeGeneratorService(AppDataSource);
            this.USER_CD = await codeGenerator.generateUserCode();
        }
    }
}