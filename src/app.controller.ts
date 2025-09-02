import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('app')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Kiểm tra trạng thái API', 
    description: 'Kiểm tra xem API có hoạt động bình thường hay không' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'API hoạt động bình thường',
    schema: {
      type: 'string',
      example: 'Hello World!'
    }
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
