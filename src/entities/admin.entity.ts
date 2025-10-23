import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum AdminRole {
    SUPER_ADMIN = 'super_admin',
    ADMIN = 'admin',
    MANAGER = 'manager'
}

@Entity('admins')
export class Admin {
    @PrimaryGeneratedColumn()
    adminId: number;

    @Column({ length: 100 })
    fullName: string;

    @Column({ unique: true })
    email: string;

    @Column({ length: 20, unique: true })
    username: string;

    @Column({ length: 255 })
    password: string;

    @Column({
        type: 'enum',
        enum: AdminRole,
        default: AdminRole.ADMIN
    })
    role: AdminRole;

    @Column({ default: true })
    isActive: boolean;

    @Column({ nullable: true })
    avatar?: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ nullable: true })
    lastLoginAt?: Date;

    @Column({ nullable: true })
    refreshToken?: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Virtual properties
    get isSuperAdmin(): boolean {
        return this.role === AdminRole.SUPER_ADMIN;
    }

    get isManager(): boolean {
        return this.role === AdminRole.MANAGER;
    }

    get canManageAdmins(): boolean {
        return this.role === AdminRole.SUPER_ADMIN;
    }

    get canManageVendors(): boolean {
        return this.role === AdminRole.SUPER_ADMIN || this.role === AdminRole.ADMIN;
    }

    get canViewReports(): boolean {
        return this.role === AdminRole.SUPER_ADMIN || this.role === AdminRole.ADMIN;
    }
}







