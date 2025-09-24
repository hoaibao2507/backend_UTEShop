import { Injectable, BadRequestException } from '@nestjs/common';
import { PaymentMethod as PaymentMethodEntity } from '../entities/payment-method.entity';
import { Payment, PaymentStatus } from '../entities/payment.entity';
import { PaymentService } from './payment.service';

export interface PaymentGatewayResponse {
  success: boolean;
  paymentUrl?: string;
  transactionId?: string;
  message: string;
  data?: any;
}

export interface PaymentCallbackData {
  transactionId: string;
  status: PaymentStatus;
  amount: number;
  gatewayData: any;
}

@Injectable()
export class PaymentGatewayService {
  constructor(private paymentService: PaymentService) {}

  async processPayment(
    payment: Payment,
    paymentMethod: PaymentMethodEntity,
  ): Promise<PaymentGatewayResponse> {
    switch (paymentMethod.name) {
      case 'COD':
        return this.processCODPayment(payment);
      case 'VNPAY':
        return this.processVNPayPayment(payment, paymentMethod);
      case 'MOMO':
        return this.processMoMoPayment(payment, paymentMethod);
      case 'ZALOPAY':
        return this.processZaloPayPayment(payment, paymentMethod);
      default:
        throw new BadRequestException(`Unsupported payment method: ${paymentMethod.name}`);
    }
  }

  async handlePaymentCallback(
    paymentMethod: string,
    callbackData: any,
  ): Promise<{ success: boolean; payment?: Payment }> {
    switch (paymentMethod) {
      case 'VNPAY':
        return this.handleVNPayCallback(callbackData);
      case 'MOMO':
        return this.handleMoMoCallback(callbackData);
      case 'ZALOPAY':
        return this.handleZaloPayCallback(callbackData);
      default:
        throw new BadRequestException(`Unsupported payment method: ${paymentMethod}`);
    }
  }

  private async processCODPayment(payment: Payment): Promise<PaymentGatewayResponse> {
    // COD doesn't need external processing
    return {
      success: true,
      message: 'COD payment created successfully. Payment will be collected on delivery.',
      transactionId: `COD_${payment.id}_${Date.now()}`,
    };
  }

  private async processVNPayPayment(
    payment: Payment,
    paymentMethod: PaymentMethodEntity,
  ): Promise<PaymentGatewayResponse> {
    try {
      const config = paymentMethod.config || {};
      const vnpayConfig = {
        vnp_TmnCode: config.tmnCode || process.env.VNPAY_TMN_CODE,
        vnp_HashSecret: config.hashSecret || process.env.VNPAY_HASH_SECRET,
        vnp_Url: config.url || process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
        vnp_ReturnUrl: config.returnUrl || process.env.VNPAY_RETURN_URL,
      };

      // Generate VNPay payment URL
      const paymentUrl = await this.generateVNPayUrl(payment, vnpayConfig);
      
      return {
        success: true,
        paymentUrl,
        message: 'VNPay payment URL generated successfully',
        transactionId: `VNPAY_${payment.id}_${Date.now()}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `VNPay payment failed: ${error.message}`,
      };
    }
  }

  private async processMoMoPayment(
    payment: Payment,
    paymentMethod: PaymentMethodEntity,
  ): Promise<PaymentGatewayResponse> {
    try {
      const config = paymentMethod.config || {};
      const momoConfig = {
        partnerCode: config.partnerCode || process.env.MOMO_PARTNER_CODE,
        accessKey: config.accessKey || process.env.MOMO_ACCESS_KEY,
        secretKey: config.secretKey || process.env.MOMO_SECRET_KEY,
        endpoint: config.endpoint || process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create',
        returnUrl: config.returnUrl || process.env.MOMO_RETURN_URL,
      };

      // Generate MoMo payment URL
      const paymentUrl = await this.generateMoMoUrl(payment, momoConfig);
      
      return {
        success: true,
        paymentUrl,
        message: 'MoMo payment URL generated successfully',
        transactionId: `MOMO_${payment.id}_${Date.now()}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `MoMo payment failed: ${error.message}`,
      };
    }
  }

  private async processZaloPayPayment(
    payment: Payment,
    paymentMethod: PaymentMethodEntity,
  ): Promise<PaymentGatewayResponse> {
    try {
      const config = paymentMethod.config || {};
      const zalopayConfig = {
        appId: config.appId || process.env.ZALOPAY_APP_ID,
        key1: config.key1 || process.env.ZALOPAY_KEY1,
        key2: config.key2 || process.env.ZALOPAY_KEY2,
        endpoint: config.endpoint || process.env.ZALOPAY_ENDPOINT || 'https://sb-openapi.zalopay.vn/v2/create',
        returnUrl: config.returnUrl || process.env.ZALOPAY_RETURN_URL,
      };

      // Generate ZaloPay payment URL
      const paymentUrl = await this.generateZaloPayUrl(payment, zalopayConfig);
      
      return {
        success: true,
        paymentUrl,
        message: 'ZaloPay payment URL generated successfully',
        transactionId: `ZALOPAY_${payment.id}_${Date.now()}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `ZaloPay payment failed: ${error.message}`,
      };
    }
  }

  private async generateVNPayUrl(payment: Payment, config: any): Promise<string> {
    // This is a simplified implementation
    // In production, you would use the actual VNPay SDK
    const params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: config.vnp_TmnCode,
      vnp_Amount: (payment.amount * 100).toString(), // VNPay expects amount in cents
      vnp_CurrCode: 'VND',
      vnp_TxnRef: payment.id.toString(),
      vnp_OrderInfo: payment.description || `Payment for order #${payment.orderId}`,
      vnp_OrderType: 'other',
      vnp_Locale: 'vn',
      vnp_ReturnUrl: config.vnp_ReturnUrl,
      vnp_IpAddr: '127.0.0.1', // In production, get real IP
    };

    // Generate secure hash (simplified)
    const queryString = new URLSearchParams(params).toString();
    return `${config.vnp_Url}?${queryString}`;
  }

  private async generateMoMoUrl(payment: Payment, config: any): Promise<string> {
    // This is a simplified implementation
    // In production, you would use the actual MoMo SDK
    const params = {
      partnerCode: config.partnerCode,
      orderId: payment.id.toString(),
      orderInfo: payment.description || `Payment for order #${payment.orderId}`,
      amount: payment.amount.toString(),
      returnUrl: config.returnUrl,
    };

    // Generate secure hash (simplified)
    const queryString = new URLSearchParams(params).toString();
    return `${config.endpoint}?${queryString}`;
  }

  private async generateZaloPayUrl(payment: Payment, config: any): Promise<string> {
    // This is a simplified implementation
    // In production, you would use the actual ZaloPay SDK
    const params = {
      app_id: config.appId,
      app_trans_id: payment.id.toString(),
      app_user: payment.orderId.toString(),
      amount: payment.amount.toString(),
      description: payment.description || `Payment for order #${payment.orderId}`,
      return_url: config.returnUrl,
    };

    // Generate secure hash (simplified)
    const queryString = new URLSearchParams(params).toString();
    return `${config.endpoint}?${queryString}`;
  }

  private async handleVNPayCallback(callbackData: any): Promise<{ success: boolean; payment?: Payment }> {
    // Validate VNPay callback signature
    // Update payment status based on VNPay response
    const transactionId = callbackData.vnp_TransactionNo;
    const responseCode = callbackData.vnp_ResponseCode;
    
    if (responseCode === '00') {
      // Payment successful
      const payment = await this.paymentService.findByOrderId(callbackData.vnp_TxnRef);
      await this.paymentService.updateStatus(payment.id, {
        status: PaymentStatus.SUCCESS,
        transactionId,
        gatewayData: callbackData,
      });
      
      return { success: true, payment };
    } else {
      // Payment failed
      const payment = await this.paymentService.findByOrderId(callbackData.vnp_TxnRef);
      await this.paymentService.updateStatus(payment.id, {
        status: PaymentStatus.FAILED,
        transactionId,
        gatewayData: callbackData,
      });
      
      return { success: false, payment };
    }
  }

  private async handleMoMoCallback(callbackData: any): Promise<{ success: boolean; payment?: Payment }> {
    // Validate MoMo callback signature
    // Update payment status based on MoMo response
    const transactionId = callbackData.transId;
    const resultCode = callbackData.resultCode;
    
    if (resultCode === 0) {
      // Payment successful
      const payment = await this.paymentService.findByOrderId(callbackData.orderId);
      await this.paymentService.updateStatus(payment.id, {
        status: PaymentStatus.SUCCESS,
        transactionId,
        gatewayData: callbackData,
      });
      
      return { success: true, payment };
    } else {
      // Payment failed
      const payment = await this.paymentService.findByOrderId(callbackData.orderId);
      await this.paymentService.updateStatus(payment.id, {
        status: PaymentStatus.FAILED,
        transactionId,
        gatewayData: callbackData,
      });
      
      return { success: false, payment };
    }
  }

  private async handleZaloPayCallback(callbackData: any): Promise<{ success: boolean; payment?: Payment }> {
    // Validate ZaloPay callback signature
    // Update payment status based on ZaloPay response
    const transactionId = callbackData.zp_trans_id;
    const status = callbackData.status;
    
    if (status === 1) {
      // Payment successful
      const payment = await this.paymentService.findByOrderId(callbackData.app_trans_id);
      await this.paymentService.updateStatus(payment.id, {
        status: PaymentStatus.SUCCESS,
        transactionId,
        gatewayData: callbackData,
      });
      
      return { success: true, payment };
    } else {
      // Payment failed
      const payment = await this.paymentService.findByOrderId(callbackData.app_trans_id);
      await this.paymentService.updateStatus(payment.id, {
        status: PaymentStatus.FAILED,
        transactionId,
        gatewayData: callbackData,
      });
      
      return { success: false, payment };
    }
  }
}
