import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ unique: true })
    username: string;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @Column({ nullable: true })
    otpCode: string;

    @Column({ type: 'bigint', nullable: true })
    otpExpiry: number; // thời gian hết hạn OTP (timestamp)

    @Column({ default: false })
    isVerified: boolean;

    @Column({ nullable: true })
    refreshToken: string;

}
