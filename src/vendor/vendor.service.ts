import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vendor, VendorStatus } from '../entities/vendor.entity';
import { VendorRegistrationDto, VendorApprovalDto, VendorUpdateDto, VendorQueryDto, VendorLoginDto } from './dto/vendor.dto';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';

@Injectable()
export class VendorService {
  constructor(
    @InjectRepository(Vendor)
    private vendorRepository: Repository<Vendor>,
  ) {}

  async register(vendorRegistrationDto: VendorRegistrationDto): Promise<Vendor> {
    // Check if email already exists
    const existingVendorByEmail = await this.vendorRepository.findOne({ 
      where: { email: vendorRegistrationDto.email } 
    });
    if (existingVendorByEmail) {
      throw new ConflictException('Email đã được sử dụng. Vui lòng chọn email khác.');
    }

    // Check if username already exists
    const existingVendorByUsername = await this.vendorRepository.findOne({ 
      where: { username: vendorRegistrationDto.username } 
    });
    if (existingVendorByUsername) {
      throw new ConflictException('Tên đăng nhập đã được sử dụng. Vui lòng chọn tên khác.');
    }

    // Check if phone already exists
    const existingVendorByPhone = await this.vendorRepository.findOne({ 
      where: { phone: vendorRegistrationDto.phone } 
    });
    if (existingVendorByPhone) {
      throw new ConflictException('Số điện thoại đã được sử dụng. Vui lòng chọn số khác.');
    }

    // Check if tax code already exists
    const existingVendorByTaxCode = await this.vendorRepository.findOne({ 
      where: { taxCode: vendorRegistrationDto.taxCode } 
    });
    if (existingVendorByTaxCode) {
      throw new ConflictException('Mã số thuế đã được sử dụng. Vui lòng kiểm tra lại.');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(vendorRegistrationDto.password, 10);

    // Create vendor
    const vendor = this.vendorRepository.create({
      ...vendorRegistrationDto,
      password: hashedPassword,
      status: VendorStatus.PENDING_APPROVAL,
      isActive: true,
    });

    const savedVendor = await this.vendorRepository.save(vendor);

    // Send notification email to admin (optional)
    await this.sendRegistrationNotification(savedVendor);

    return savedVendor;
  }

  async findAll(query: VendorQueryDto): Promise<{ vendors: Vendor[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 10, status, search, sortBy = 'createdAt', sortOrder = 'DESC' } = query;

    const queryBuilder = this.vendorRepository.createQueryBuilder('vendor');

    // Apply filters
    if (status) {
      queryBuilder.andWhere('vendor.status = :status', { status });
    }

    if (search) {
      queryBuilder.andWhere(
        '(vendor.storeName LIKE :search OR vendor.ownerName LIKE :search OR vendor.email LIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Apply sorting
    queryBuilder.orderBy(`vendor.${sortBy}`, sortOrder);

    // Apply pagination
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [vendors, total] = await queryBuilder.getManyAndCount();

    return {
      vendors,
      total,
      page,
      limit,
    };
  }

  async findOne(id: number): Promise<Vendor> {
    const vendor = await this.vendorRepository.findOne({
      where: { vendorId: id },
    });

    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${id} not found`);
    }

    return vendor;
  }

  async findByEmail(email: string): Promise<Vendor> {
    const vendor = await this.vendorRepository.findOne({
      where: { email },
    });

    if (!vendor) {
      throw new NotFoundException(`Vendor with email ${email} not found`);
    }

    return vendor;
  }

  async findByUsername(username: string): Promise<Vendor> {
    const vendor = await this.vendorRepository.findOne({
      where: { username },
    });

    if (!vendor) {
      throw new NotFoundException(`Vendor with username ${username} not found`);
    }

    return vendor;
  }

  async update(id: number, vendorUpdateDto: VendorUpdateDto): Promise<Vendor> {
    const vendor = await this.findOne(id);

    try {
      Object.assign(vendor, vendorUpdateDto);
      return await this.vendorRepository.save(vendor);
    } catch (error) {
      throw new BadRequestException('Failed to update vendor');
    }
  }

  async approve(id: number, approvalDto: VendorApprovalDto): Promise<Vendor> {
    const vendor = await this.findOne(id);

    if (vendor.status !== VendorStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Vendor is not in pending approval status');
    }

    vendor.status = approvalDto.status;
    vendor.approvedBy = approvalDto.adminId;
    vendor.approvedAt = new Date();

    if (approvalDto.status === VendorStatus.REJECTED) {
      vendor.rejectionReason = approvalDto.rejectionReason;
      vendor.rejectedBy = approvalDto.adminId;
      vendor.rejectedAt = new Date();
    }

    const savedVendor = await this.vendorRepository.save(vendor);

    // Send email notification
    if (approvalDto.status === VendorStatus.ACTIVE) {
      await this.sendApprovalEmail(savedVendor);
    } else if (approvalDto.status === VendorStatus.REJECTED) {
      await this.sendRejectionEmail(savedVendor);
    }

    return savedVendor;
  }

  async suspend(id: number, adminId: number, reason?: string): Promise<Vendor> {
    const vendor = await this.findOne(id);

    if (vendor.status !== VendorStatus.ACTIVE) {
      throw new BadRequestException('Only active vendors can be suspended');
    }

    vendor.status = VendorStatus.SUSPENDED;
    vendor.rejectionReason = reason;
    vendor.rejectedBy = adminId;
    vendor.rejectedAt = new Date();

    return await this.vendorRepository.save(vendor);
  }

  async activate(id: number, adminId: number): Promise<Vendor> {
    const vendor = await this.findOne(id);

    if (vendor.status !== VendorStatus.SUSPENDED) {
      throw new BadRequestException('Only suspended vendors can be activated');
    }

    vendor.status = VendorStatus.ACTIVE;
    vendor.approvedBy = adminId;
    vendor.approvedAt = new Date();
    vendor.rejectionReason = undefined;
    vendor.rejectedBy = undefined;
    vendor.rejectedAt = undefined;

    return await this.vendorRepository.save(vendor);
  }

  async remove(id: number): Promise<void> {
    const vendor = await this.findOne(id);

    try {
      await this.vendorRepository.remove(vendor);
    } catch (error) {
      throw new BadRequestException('Failed to delete vendor');
    }
  }

  async validateVendor(username: string, password: string): Promise<Vendor | null> {
    const vendor = await this.vendorRepository.findOne({
      where: { username },
    });

    if (!vendor) {
      return null;
    }

    if (vendor.status !== VendorStatus.ACTIVE) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, vendor.password);
    if (!isPasswordValid) {
      return null;
    }

    return vendor;
  }

  async getPendingApprovals(): Promise<Vendor[]> {
    return this.vendorRepository.find({
      where: { status: VendorStatus.PENDING_APPROVAL },
      order: { createdAt: 'ASC' },
    });
  }

  async getVendorStatistics(): Promise<{
    totalVendors: number;
    activeVendors: number;
    pendingVendors: number;
    suspendedVendors: number;
    rejectedVendors: number;
  }> {
    const [totalVendors, activeVendors, pendingVendors, suspendedVendors, rejectedVendors] = await Promise.all([
      this.vendorRepository.count(),
      this.vendorRepository.count({ where: { status: VendorStatus.ACTIVE } }),
      this.vendorRepository.count({ where: { status: VendorStatus.PENDING_APPROVAL } }),
      this.vendorRepository.count({ where: { status: VendorStatus.SUSPENDED } }),
      this.vendorRepository.count({ where: { status: VendorStatus.REJECTED } }),
    ]);

    return {
      totalVendors,
      activeVendors,
      pendingVendors,
      suspendedVendors,
      rejectedVendors,
    };
  }

  private async sendRegistrationNotification(vendor: Vendor): Promise<void> {
    // Send email to admin about new vendor registration
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: 'duongnguyenhoaibao2507@gmail.com',
        pass: 'iokm ejef vvkv eggc',
      },
    });

    await transporter.sendMail({
      from: '"UTEShop" <duongnguyenhoaibao2507@gmail.com>',
      to: 'admin@uteshop.com', // Admin email
      subject: 'Thông báo đăng ký nhà cung cấp mới',
      html: `
        <h2>Thông báo đăng ký nhà cung cấp mới</h2>
        <p>Có một nhà cung cấp mới đăng ký:</p>
        <ul>
          <li><strong>Tên cửa hàng:</strong> ${vendor.storeName}</li>
          <li><strong>Chủ sở hữu:</strong> ${vendor.ownerName}</li>
          <li><strong>Email:</strong> ${vendor.email}</li>
          <li><strong>SĐT:</strong> ${vendor.phone}</li>
          <li><strong>Địa chỉ:</strong> ${vendor.address}, ${vendor.ward}, ${vendor.city}</li>
        </ul>
        <p>Vui lòng truy cập trang quản trị để duyệt đăng ký.</p>
      `,
    });
  }

  private async sendApprovalEmail(vendor: Vendor): Promise<void> {
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: 'duongnguyenhoaibao2507@gmail.com',
        pass: 'iokm ejef vvkv eggc',
      },
    });

    await transporter.sendMail({
      from: '"UTEShop" <duongnguyenhoaibao2507@gmail.com>',
      to: vendor.email,
      subject: 'Chúc mừng! Bạn đã trở thành nhà cung cấp trên UTEShop',
      html: `
        <h2>Chúc mừng ${vendor.storeName}!</h2>
        <p>Yêu cầu đăng ký nhà cung cấp của bạn đã được duyệt thành công.</p>
        <p>Bây giờ bạn có thể:</p>
        <ul>
          <li>Đăng nhập vào Vendor Dashboard</li>
          <li>Thêm và quản lý sản phẩm</li>
          <li>Theo dõi đơn hàng</li>
          <li>Xem báo cáo doanh thu</li>
        </ul>
        <p><strong>Tên đăng nhập:</strong> ${vendor.username}</p>
        <p>Vui lòng truy cập <a href="http://localhost:3000/vendor/login">Vendor Dashboard</a> để bắt đầu.</p>
        <p>Chúc bạn kinh doanh thành công!</p>
      `,
    });
  }

  private async sendRejectionEmail(vendor: Vendor): Promise<void> {
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: 'duongnguyenhoaibao2507@gmail.com',
        pass: 'iokm ejef vvkv eggc',
      },
    });

    await transporter.sendMail({
      from: '"UTEShop" <duongnguyenhoaibao2507@gmail.com>',
      to: vendor.email,
      subject: 'Thông báo về yêu cầu đăng ký nhà cung cấp',
      html: `
        <h2>Thông báo về yêu cầu đăng ký nhà cung cấp</h2>
        <p>Xin chào ${vendor.storeName},</p>
        <p>Rất tiếc, yêu cầu đăng ký nhà cung cấp của bạn đã bị từ chối.</p>
        ${vendor.rejectionReason ? `<p><strong>Lý do:</strong> ${vendor.rejectionReason}</p>` : ''}
        <p>Vui lòng kiểm tra lại thông tin hoặc liên hệ bộ phận hỗ trợ để được hỗ trợ.</p>
        <p>Email hỗ trợ: support@uteshop.com</p>
        <p>Hotline: 1900-xxxx</p>
      `,
    });
  }
}
