import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity('product_images')
export class ProductImage {
    @PrimaryGeneratedColumn()
    imageId: number;

    @Column()
    productId: number;

    @Column({ length: 500 })
    imageUrl: string;

    @Column({ length: 200, nullable: true })
    publicId: string;

    @Column({ default: false })
    isPrimary: boolean;

    @Column({ default: 0 })
    sortOrder: number;

    // Relations
    @ManyToOne(() => Product, product => product.images)
    @JoinColumn({ name: 'productId' })
    product: Product;
}
