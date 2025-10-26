import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

export enum Gender {
    MALE = 'male',
    FEMALE = 'female',
    OTHER = 'other'
}

export enum UserRole {
    CUSTOMER = 'customer',
    STAFF = 'staff',
    MANAGER = 'manager'
}

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ length: 50 })
    firstName: string;

    @Column({ length: 50 })
    lastName: string;

    @Column({ unique: true })
    email: string;

    @Column({ length: 20, unique: true, nullable: true })
    phone: string;

    @Column({ length: 255, nullable: true })
    address: string;

    @Column({ length: 100, nullable: true })
    city: string;

    @Column({
        type: 'enum',
        enum: Gender,
        nullable: true
    })
    gender: Gender;

    @Column({ type: 'date', nullable: true })
    dateOfBirth: Date;

    @Column({ nullable: true })
    password: string;

    @Column({ default: false })
    isVerified: boolean;

    @Column({ nullable: true })
    otpCode: string;

    @Column({ type: 'bigint', nullable: true })
    otpExpiry: number;

    @Column({ nullable: true })
    refreshToken: string;

    @Column({ nullable: true })
    avatar: string;

    @Column({ nullable: true })
    googleId: string;

    @Column({ nullable: true })
    provider: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.CUSTOMER
    })
    role: UserRole;

    @Column({ default: true })
    isActive: boolean;

    @Column({ nullable: true })
    lastLoginAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Relations (using string references to avoid circular imports)
    @OneToMany('Order', 'user')
    orders: any[];

    @OneToMany('Cart', 'user')
    carts: any[];

    @OneToMany('ProductReview', 'user')
    reviews: any[];

    @OneToMany('Wishlist', 'user')
    wishlists: any[];

    // Virtual properties (not stored in database)
    get fullName(): string {
        return `${this.firstName} ${this.lastName}`.trim();
    }

    get age(): number | null {
        if (!this.dateOfBirth) return null;
        const today = new Date();
        const birthDate = new Date(this.dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        return age;
    }

    get isStaff(): boolean {
        return this.role === UserRole.STAFF;
    }

    get isManager(): boolean {
        return this.role === UserRole.MANAGER;
    }

    get isCustomer(): boolean {
        return this.role === UserRole.CUSTOMER;
    }

    get canManageOrders(): boolean {
        return this.role === UserRole.STAFF || this.role === UserRole.MANAGER;
    }

    get canManageProducts(): boolean {
        return this.role === UserRole.STAFF || this.role === UserRole.MANAGER;
    }

    get canViewReports(): boolean {
        return this.role === UserRole.MANAGER;
    }
}
