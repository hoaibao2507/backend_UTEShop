import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

export enum VendorStatus {
    PENDING_APPROVAL = 'pending_approval',
    ACTIVE = 'active',
    SUSPENDED = 'suspended',
    REJECTED = 'rejected'
}

@Entity('vendors')
export class Vendor {
    @PrimaryGeneratedColumn()
    vendorId: number;

    @Column({ length: 100 })
    storeName: string;

    @Column({ length: 100 })
    ownerName: string;

    @Column({ unique: true })
    email: string;

    @Column({ length: 20, unique: true })
    phone: string;

    @Column({ type: 'text' })
    address: string;

    @Column({ length: 100 })
    city: string;

    @Column({ length: 100 })
    ward: string;

    @Column({ length: 50, nullable: true })
    businessLicense?: string;

    @Column({ length: 13, unique: true })
    taxCode: string;

    @Column({ length: 255, nullable: true })
    username: string;

    @Column({ length: 255, nullable: true })
    password: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ length: 255, nullable: true })
    logo?: string;

    @Column({ length: 255, nullable: true })
    banner?: string;

    @Column({
        type: 'enum',
        enum: VendorStatus,
        default: VendorStatus.PENDING_APPROVAL
    })
    status: VendorStatus;

    @Column({ type: 'text', nullable: true })
    rejectionReason?: string;

    @Column({ type: 'timestamp', nullable: true })
    approvedAt?: Date;

    @Column({ type: 'timestamp', nullable: true })
    rejectedAt?: Date;

    @Column({ nullable: true })
    approvedBy?: number; // Admin ID who approved

    @Column({ nullable: true })
    rejectedBy?: number; // Admin ID who rejected

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Relations
    @OneToMany('Product', 'vendor')
    products: any[];

    @OneToMany('Order', 'vendor')
    orders: any[];

    // Virtual properties
    get isApproved(): boolean {
        return this.status === VendorStatus.ACTIVE;
    }

    get isPending(): boolean {
        return this.status === VendorStatus.PENDING_APPROVAL;
    }

    get isRejected(): boolean {
        return this.status === VendorStatus.REJECTED;
    }

    get isSuspended(): boolean {
        return this.status === VendorStatus.SUSPENDED;
    }

    get canSell(): boolean {
        return this.status === VendorStatus.ACTIVE && this.isActive;
    }
}
