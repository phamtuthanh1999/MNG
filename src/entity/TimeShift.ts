import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';

/**
 * TimeShift entity - Ca làm việc (TB_TIME_SHIFT)
 *
 * Lưu từng ca làm việc của user theo ngày.
 * - USER_CD: mã người dùng (FK TB_USER.USER_CD)
 * - SHIFT_NM: tên ca (VD: "Ca 1: Làm báo cáo")
 * - SHIFT_DATE: ngày làm (YYYY-MM-DD)
 * - START_TIME: giờ bắt đầu (HH:MM)
 * - END_TIME: giờ kết thúc (HH:MM)
 * - DURATION_MIN: tổng phút (tự tính)
 * - NOTE: ghi chú
 */
@Entity('TB_TIME_SHIFT')
export class TimeShift {
  @PrimaryGeneratedColumn('increment')
  ID!: number;

  @Column({ type: 'varchar', length: 255 })
  USER_CD!: string; // Mã user (FK TB_USER.USER_CD)

  @Column({ type: 'varchar', length: 255 })
  SHIFT_NM!: string; // Tên ca

  @Column({ type: 'date' })
  SHIFT_DATE!: string; // Ngày làm (YYYY-MM-DD)

  @Column({ type: 'varchar', length: 5 })
  START_TIME!: string; // Giờ bắt đầu HH:MM

  @Column({ type: 'varchar', length: 5 })
  END_TIME!: string; // Giờ kết thúc HH:MM

  @Column({ type: 'int', default: 0 })
  DURATION_MIN!: number; // Tổng phút (tự tính)

  @Column({ type: 'text', nullable: true })
  NOTE!: string | null; // Ghi chú

  @Column({ type: 'varchar', length: 255, nullable: true })
  USER_LOGIN!: string | null; // Người tạo/cập nhật

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  /** Tự tính DURATION_MIN từ START_TIME và END_TIME */
  @BeforeInsert()
  @BeforeUpdate()
  calcDuration() {
    const [sh, sm] = this.START_TIME.split(':').map(Number);
    const [eh, em] = this.END_TIME.split(':').map(Number);
    const total = (eh * 60 + em) - (sh * 60 + sm);
    this.DURATION_MIN = total > 0 ? total : 0;
  }
}
