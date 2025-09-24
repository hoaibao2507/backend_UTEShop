import { Controller, Post, Body, Query, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { PaymentGatewayService } from './payment-gateway.service';
import { PaymentMethodService } from '../payment-method/payment-method.service';

@ApiTags('Payment Webhooks')
@Controller('payments/webhook')
export class PaymentWebhookController {
  constructor(
    private paymentGatewayService: PaymentGatewayService,
    private paymentMethodService: PaymentMethodService,
  ) {}

  @Post('vnpay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'VNPay webhook', description: 'Nhận callback từ VNPay khi thanh toán hoàn tất' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook data' })
  async handleVNPayWebhook(
    @Body() body: any,
    @Query() query: any,
    @Headers() headers: any,
  ): Promise<{ RspCode: string; Message: string }> {
    try {
      // Combine body and query parameters
      const callbackData = { ...body, ...query };
      
      const result = await this.paymentGatewayService.handlePaymentCallback('VNPAY', callbackData);
      
      if (result.success) {
        return {
          RspCode: '00',
          Message: 'Success',
        };
      } else {
        return {
          RspCode: '99',
          Message: 'Failed',
        };
      }
    } catch (error) {
      return {
        RspCode: '99',
        Message: error.message || 'Unknown error',
      };
    }
  }

  @Post('momo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'MoMo webhook', description: 'Nhận callback từ MoMo khi thanh toán hoàn tất' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook data' })
  async handleMoMoWebhook(
    @Body() body: any,
    @Query() query: any,
    @Headers() headers: any,
  ): Promise<{ resultCode: number; message: string }> {
    try {
      // Combine body and query parameters
      const callbackData = { ...body, ...query };
      
      const result = await this.paymentGatewayService.handlePaymentCallback('MOMO', callbackData);
      
      if (result.success) {
        return {
          resultCode: 0,
          message: 'Success',
        };
      } else {
        return {
          resultCode: 1,
          message: 'Failed',
        };
      }
    } catch (error) {
      return {
        resultCode: 1,
        message: error.message || 'Unknown error',
      };
    }
  }

  @Post('zalopay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'ZaloPay webhook', description: 'Nhận callback từ ZaloPay khi thanh toán hoàn tất' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook data' })
  async handleZaloPayWebhook(
    @Body() body: any,
    @Query() query: any,
    @Headers() headers: any,
  ): Promise<{ return_code: number; return_message: string }> {
    try {
      // Combine body and query parameters
      const callbackData = { ...body, ...query };
      
      const result = await this.paymentGatewayService.handlePaymentCallback('ZALOPAY', callbackData);
      
      if (result.success) {
        return {
          return_code: 1,
          return_message: 'Success',
        };
      } else {
        return {
          return_code: 0,
          return_message: 'Failed',
        };
      }
    } catch (error) {
      return {
        return_code: 0,
        return_message: error.message || 'Unknown error',
      };
    }
  }

  @Post('generic')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generic webhook', description: 'Webhook chung cho tất cả payment gateway' })
  @ApiQuery({ name: 'gateway', description: 'Payment gateway name (vnpay, momo, zalopay)' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook data' })
  async handleGenericWebhook(
    @Query('gateway') gateway: string,
    @Body() body: any,
    @Query() query: any,
    @Headers() headers: any,
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (!gateway) {
        throw new Error('Gateway parameter is required');
      }

      // Combine body and query parameters
      const callbackData = { ...body, ...query };
      
      const result = await this.paymentGatewayService.handlePaymentCallback(gateway.toUpperCase(), callbackData);
      
      return {
        success: result.success,
        message: result.success ? 'Webhook processed successfully' : 'Webhook processing failed',
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Unknown error',
      };
    }
  }
}

