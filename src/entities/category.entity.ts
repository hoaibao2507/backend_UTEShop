import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Product } from './product.entity';

@Entity('categories')
export class Category {
    @PrimaryGeneratedColumn()
    categoryId: number;

    @Column({ length: 100 })
    categoryName: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'int', default: 0 })
    productCount: number;

    @CreateDateColumn()
    createdAt: Date;

    // Relations
    @OneToMany(() => Product, product => product.category)
    products: Product[];
}
