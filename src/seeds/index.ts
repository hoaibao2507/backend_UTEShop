import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Category } from '../entities/category.entity';
import { Product } from '../entities/product.entity';
import { ProductImage } from '../entities/product-image.entity';
import { ProductReview } from '../entities/product-review.entity';
import { User, Gender } from '../users/users.entity';
import { Order } from '../entities/order.entity';
import { OrderStatus } from '../entities/order-status.enum';
import { OrderDetail } from '../entities/order-detail.entity';
import { Cart } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';
import { ProductView } from '../entities/product-view.entity';
import * as bcrypt from 'bcrypt';
import { OrderTracking } from 'src/entities';
import { seedNotificationTemplates } from './notification-template.seed';
import { seedUserNotificationPreferences } from './user-notification-preferences.seed';

config();

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'uteshop',
  entities: [
    Category,
    Product,
    ProductImage,
    ProductReview,
    User,
    Order,
    OrderDetail,
    OrderTracking,
    Cart,
    CartItem,
    ProductView,
  ],
  synchronize: false,
  logging: true,
});

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log('Database connection established');

    // Clear existing data (disable foreign key checks temporarily)
    await AppDataSource.query('SET FOREIGN_KEY_CHECKS = 0;');
    
    await AppDataSource.getRepository(ProductView).clear();
    await AppDataSource.getRepository(CartItem).clear();
    await AppDataSource.getRepository(Cart).clear();
    await AppDataSource.getRepository(OrderDetail).clear();
    await AppDataSource.getRepository(Order).clear();
    await AppDataSource.getRepository(ProductReview).clear();
    await AppDataSource.getRepository(ProductImage).clear();
    await AppDataSource.getRepository(Product).clear();
    await AppDataSource.getRepository(Category).clear();
    await AppDataSource.getRepository(User).clear();
    
    await AppDataSource.query('SET FOREIGN_KEY_CHECKS = 1;');

    console.log('Cleared existing data');

    // Seed categories
    const categories = await seedCategories();
    console.log(`Seeded ${categories.length} categories`);

    // Seed users
    const users = await seedUsers();
    console.log(`Seeded ${users.length} users`);

    // Seed products
    const products = await seedProducts(categories);
    console.log(`Seeded ${products.length} products`);

    // Seed product images
    await seedProductImages(products);
    console.log('Seeded product images');

    // Seed product reviews
    await seedProductReviews(products, users);
    console.log('Seeded product reviews');

    // Seed orders
    await seedOrders(users, products);
    console.log('Seeded orders');

    // Seed carts
    await seedCarts(users, products);
    console.log('Seeded carts');

    // Seed product views
    await seedProductViews(products, users);
    console.log('Seeded product views');

    // Seed notification templates
    await seedNotificationTemplates(AppDataSource);
    console.log('Seeded notification templates');

    // Seed user notification preferences
    await seedUserNotificationPreferences(AppDataSource);
    console.log('Seeded user notification preferences');

    console.log('✅ Seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

async function seedCategories() {
  const categoryRepository = AppDataSource.getRepository(Category);
  
  const categories = [
    {
      categoryName: 'Điện thoại',
      description: 'Các loại điện thoại thông minh, smartphone cao cấp'
    },
    {
      categoryName: 'Laptop',
      description: 'Máy tính xách tay, laptop gaming, laptop văn phòng'
    },
    {
      categoryName: 'Phụ kiện',
      description: 'Các phụ kiện điện tử, tai nghe, sạc, ốp lưng'
    },
    {
      categoryName: 'Đồng hồ thông minh',
      description: 'Smartwatch, đồng hồ thông minh, fitness tracker'
    },
    {
      categoryName: 'Máy tính bảng',
      description: 'iPad, tablet Android, máy tính bảng'
    },
    {
      categoryName: 'Tivi & Âm thanh',
      description: 'Smart TV, loa, tai nghe, hệ thống âm thanh'
    }
  ];

  const savedCategories: Category[] = [];
  for (const categoryData of categories) {
    const category = categoryRepository.create(categoryData);
    const savedCategory = await categoryRepository.save(category);
    savedCategories.push(savedCategory);
  }

  return savedCategories;
}

async function seedUsers() {
  const userRepository = AppDataSource.getRepository(User);
  
  const users = [
    {
      firstName: 'Nguyễn',
      lastName: 'Văn An',
      email: 'nguyenvanan@example.com',
      phone: '0123456789',
      address: '123 Đường ABC, Quận 1',
      city: 'TP. Hồ Chí Minh',
      gender: Gender.MALE,
      dateOfBirth: new Date('1990-05-15'),
      password: await bcrypt.hash('password123', 10),
      isVerified: true
    },
    {
      firstName: 'Trần',
      lastName: 'Thị Bình',
      email: 'tranthibinh@example.com',
      phone: '0987654321',
      address: '456 Đường XYZ, Quận 2',
      city: 'TP. Hồ Chí Minh',
      gender: Gender.FEMALE,
      dateOfBirth: new Date('1992-08-20'),
      password: await bcrypt.hash('password123', 10),
      isVerified: true
    },
    {
      firstName: 'Lê',
      lastName: 'Minh Cường',
      email: 'leminhcuong@example.com',
      phone: '0369852147',
      address: '789 Đường DEF, Quận 3',
      city: 'TP. Hồ Chí Minh',
      gender: Gender.MALE,
      dateOfBirth: new Date('1988-12-10'),
      password: await bcrypt.hash('password123', 10),
      isVerified: true
    },
    {
      firstName: 'Phạm',
      lastName: 'Thị Dung',
      email: 'phamthidung@example.com',
      phone: '0741258963',
      address: '321 Đường GHI, Quận 4',
      city: 'TP. Hồ Chí Minh',
      gender: Gender.FEMALE,
      dateOfBirth: new Date('1995-03-25'),
      password: await bcrypt.hash('password123', 10),
      isVerified: true
    },
    {
      firstName: 'Hoàng',
      lastName: 'Văn Em',
      email: 'hoangvanem@example.com',
      phone: '0852147369',
      address: '654 Đường JKL, Quận 5',
      city: 'TP. Hồ Chí Minh',
      gender: Gender.MALE,
      dateOfBirth: new Date('1993-07-18'),
      password: await bcrypt.hash('password123', 10),
      isVerified: true
    }
  ];

  const savedUsers: User[] = [];
  for (const userData of users) {
    const user = userRepository.create(userData);
    const savedUser = await userRepository.save(user);
    savedUsers.push(savedUser);
  }

  return savedUsers;
}

async function seedProducts(categories: Category[]) {
  const productRepository = AppDataSource.getRepository(Product);
  
  const products = [
    // Điện thoại
    {
      categoryId: categories[0].categoryId,
      productName: 'iPhone 15 Pro Max',
      description: 'iPhone 15 Pro Max với chip A17 Pro, camera 48MP, màn hình 6.7 inch Super Retina XDR',
      price: 29990000,
      discountPercent: 5,
      stockQuantity: 50
    },
    {
      categoryId: categories[0].categoryId,
      productName: 'Samsung Galaxy S24 Ultra',
      description: 'Samsung Galaxy S24 Ultra với S Pen, camera 200MP, màn hình 6.8 inch Dynamic AMOLED 2X',
      price: 26990000,
      discountPercent: 8,
      stockQuantity: 30
    },
    {
      categoryId: categories[0].categoryId,
      productName: 'Xiaomi 14 Pro',
      description: 'Xiaomi 14 Pro với chip Snapdragon 8 Gen 3, camera Leica, màn hình 6.73 inch LTPO OLED',
      price: 19990000,
      discountPercent: 10,
      stockQuantity: 25
    },
    // Laptop
    {
      categoryId: categories[1].categoryId,
      productName: 'MacBook Pro 16 inch M3 Max',
      description: 'MacBook Pro 16 inch với chip M3 Max, 32GB RAM, 1TB SSD, màn hình Liquid Retina XDR',
      price: 69990000,
      discountPercent: 3,
      stockQuantity: 15
    },
    {
      categoryId: categories[1].categoryId,
      productName: 'Dell XPS 15',
      description: 'Dell XPS 15 với Intel Core i7, 16GB RAM, 512GB SSD, màn hình 15.6 inch 4K OLED',
      price: 45990000,
      discountPercent: 7,
      stockQuantity: 20
    },
    {
      categoryId: categories[1].categoryId,
      productName: 'ASUS ROG Strix G15',
      description: 'ASUS ROG Strix G15 Gaming với AMD Ryzen 7, RTX 4060, 16GB RAM, 1TB SSD',
      price: 32990000,
      discountPercent: 12,
      stockQuantity: 18
    },
    // Phụ kiện
    {
      categoryId: categories[2].categoryId,
      productName: 'AirPods Pro 2',
      description: 'AirPods Pro thế hệ 2 với chip H2, chống ồn chủ động, thời lượng pin 6 giờ',
      price: 5990000,
      discountPercent: 5,
      stockQuantity: 100
    },
    {
      categoryId: categories[2].categoryId,
      productName: 'Samsung Galaxy Buds2 Pro',
      description: 'Samsung Galaxy Buds2 Pro với chống ồn thông minh, âm thanh 24bit/48kHz',
      price: 3990000,
      discountPercent: 8,
      stockQuantity: 80
    },
    {
      categoryId: categories[2].categoryId,
      productName: 'MagSafe Charger',
      description: 'Sạc không dây MagSafe cho iPhone, công suất 15W, tương thích với iPhone 12 trở lên',
      price: 1290000,
      discountPercent: 0,
      stockQuantity: 150
    },
    // Đồng hồ thông minh
    {
      categoryId: categories[3].categoryId,
      productName: 'Apple Watch Series 9',
      description: 'Apple Watch Series 9 với chip S9, màn hình Always-On, theo dõi sức khỏe toàn diện',
      price: 8990000,
      discountPercent: 6,
      stockQuantity: 40
    },
    {
      categoryId: categories[3].categoryId,
      productName: 'Samsung Galaxy Watch6 Classic',
      description: 'Samsung Galaxy Watch6 Classic với vòng xoay vật lý, màn hình 1.5 inch, pin 2 ngày',
      price: 6990000,
      discountPercent: 10,
      stockQuantity: 35
    },
    // Máy tính bảng
    {
      categoryId: categories[4].categoryId,
      productName: 'iPad Pro 12.9 inch M2',
      description: 'iPad Pro 12.9 inch với chip M2, màn hình Liquid Retina XDR, hỗ trợ Apple Pencil 2',
      price: 24990000,
      discountPercent: 4,
      stockQuantity: 25
    },
    {
      categoryId: categories[4].categoryId,
      productName: 'Samsung Galaxy Tab S9 Ultra',
      description: 'Samsung Galaxy Tab S9 Ultra với chip Snapdragon 8 Gen 2, màn hình 14.6 inch, S Pen',
      price: 19990000,
      discountPercent: 8,
      stockQuantity: 20
    },
    // Tivi & Âm thanh
    {
      categoryId: categories[5].categoryId,
      productName: 'Samsung QLED 4K 65 inch',
      description: 'Samsung QLED 4K 65 inch với công nghệ Quantum Dot, HDR10+, Smart TV Tizen',
      price: 19990000,
      discountPercent: 15,
      stockQuantity: 10
    },
    {
      categoryId: categories[5].categoryId,
      productName: 'Sony WH-1000XM5',
      description: 'Sony WH-1000XM5 tai nghe chống ồn với chip V1, âm thanh Hi-Res, pin 30 giờ',
      price: 7990000,
      discountPercent: 5,
      stockQuantity: 60
    }
  ];

  const savedProducts: Product[] = [];
  for (const productData of products) {
    const product = productRepository.create(productData);
    const savedProduct = await productRepository.save(product);
    savedProducts.push(savedProduct);
  }

  return savedProducts;
}

async function seedProductImages(products: Product[]) {
  const productImageRepository = AppDataSource.getRepository(ProductImage);
  
  const imageUrls = [
    'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500',
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500',
    'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=500',
    'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500',
    'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=500',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500'
  ];

  for (const product of products) {
    // Mỗi sản phẩm có 4-6 hình ảnh
    const numImages = Math.floor(Math.random() * 3) + 4;
    
    // Tạo array ngẫu nhiên các index để tránh trùng lặp
    const shuffledIndices = Array.from({ length: imageUrls.length }, (_, i) => i)
      .sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < numImages; i++) {
      const productImage = productImageRepository.create({
        productId: product.productId,
        imageUrl: imageUrls[shuffledIndices[i % imageUrls.length]],
        isPrimary: i === 0
      });
      await productImageRepository.save(productImage);
    }
  }
}

async function seedProductReviews(products: Product[], users: User[]) {
  const productReviewRepository = AppDataSource.getRepository(ProductReview);
  
  const reviewComments = [
    'Sản phẩm rất tốt, đáng mua!',
    'Chất lượng tuyệt vời, giao hàng nhanh',
    'Sản phẩm đúng như mô tả, hài lòng',
    'Tuyệt vời! Sẽ mua lại lần sau',
    'Chất lượng tốt, giá cả hợp lý',
    'Sản phẩm đẹp, chức năng đầy đủ',
    'Rất hài lòng với sản phẩm này',
    'Đóng gói cẩn thận, sản phẩm nguyên vẹn',
    'Dịch vụ khách hàng tốt, tư vấn nhiệt tình',
    'Sản phẩm chất lượng cao, đáng tiền'
  ];

  for (const product of products) {
    // Mỗi sản phẩm có 3-8 đánh giá
    const numReviews = Math.floor(Math.random() * 6) + 3;
    for (let i = 0; i < numReviews; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomRating = Math.floor(Math.random() * 5) + 1;
      const randomComment = reviewComments[Math.floor(Math.random() * reviewComments.length)];

      const productReview = productReviewRepository.create({
        productId: product.productId,
        userId: randomUser.id,
        rating: randomRating,
        comment: randomComment
      });
      await productReviewRepository.save(productReview);
    }
  }
}

async function seedOrders(users: User[], products: Product[]) {
  const orderRepository = AppDataSource.getRepository(Order);
  const orderDetailRepository = AppDataSource.getRepository(OrderDetail);
  
  const orderStatuses = [OrderStatus.NEW, OrderStatus.CONFIRMED, OrderStatus.SHIPPING, OrderStatus.DELIVERED];

  for (let i = 0; i < 20; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const randomStatus = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
    
    // Tạo order
    const order = orderRepository.create({
      userId: randomUser.id,
      orderDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // 30 ngày gần đây
      totalAmount: 0, // Sẽ cập nhật sau
      status: randomStatus
    });
    const savedOrder = await orderRepository.save(order);

    // Tạo order details
    const numItems = Math.floor(Math.random() * 3) + 1; // 1-3 sản phẩm mỗi đơn
    let totalAmount = 0;

    for (let j = 0; j < numItems; j++) {
      const randomProduct = products[Math.floor(Math.random() * products.length)];
      const quantity = Math.floor(Math.random() * 2) + 1; // 1-2 sản phẩm
      const unitPrice = randomProduct.price * (1 - randomProduct.discountPercent / 100);
      const totalPrice = unitPrice * quantity;

      const orderDetail = orderDetailRepository.create({
        orderId: savedOrder.orderId,
        productId: randomProduct.productId,
        quantity: quantity,
        unitPrice: unitPrice,
        totalPrice: totalPrice
      });
      await orderDetailRepository.save(orderDetail);

      totalAmount += totalPrice;
    }

    // Cập nhật tổng tiền cho order
    savedOrder.totalAmount = totalAmount;
    await orderRepository.save(savedOrder);
  }
}

async function seedCarts(users: User[], products: Product[]) {
  const cartRepository = AppDataSource.getRepository(Cart);
  const cartItemRepository = AppDataSource.getRepository(CartItem);

  for (const user of users) {
    // Một số user có giỏ hàng
    if (Math.random() > 0.3) {
      const cart = cartRepository.create({
        userId: user.id
      });
      const savedCart = await cartRepository.save(cart);

      // Thêm 1-3 sản phẩm vào giỏ
      const numItems = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < numItems; i++) {
        const randomProduct = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 2) + 1;

        const cartItem = cartItemRepository.create({
          cartId: savedCart.cartId,
          productId: randomProduct.productId,
          quantity: quantity
        });
        await cartItemRepository.save(cartItem);
      }
    }
  }
}

async function seedProductViews(products: Product[], users: User[]) {
  const productViewRepository = AppDataSource.getRepository(ProductView);

  for (const product of products) {
    // Mỗi sản phẩm có 10-50 lượt xem
    const numViews = Math.floor(Math.random() * 41) + 10;
    for (let i = 0; i < numViews; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const viewDate = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000); // 7 ngày gần đây

      const productView = productViewRepository.create({
        productId: product.productId,
        userId: randomUser.id,
        viewedAt: viewDate
      });
      await productViewRepository.save(productView);
    }
  }
}

// Chạy seed
seed();
