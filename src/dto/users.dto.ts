import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
    @ApiProperty({example: 'string'})
    name: string;

    @ApiProperty({example: 'johndoe'})
    username: string;

    @ApiProperty({example: 'test@gmail.com'})
    email: string;

    @ApiProperty()
    password: string;

    @ApiProperty()
    otpCode: string;

    @ApiProperty()
    otpExpiry: number; // thời gian hết hạn OTP (timestamp)

    @ApiProperty()
    isVerified: boolean;

    @ApiProperty()
    refreshToken: string;

}
