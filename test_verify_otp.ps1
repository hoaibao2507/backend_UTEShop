# Test Verify OTP API
Write-Host "Testing Verify OTP API..." -ForegroundColor Green

# Get OTP from user input
Write-Host "Please enter the OTP code from your email:" -ForegroundColor Cyan
$otpCode = Read-Host

Write-Host "OTP entered: $otpCode" -ForegroundColor Yellow

# Test Verify OTP
$verifyOtpBody = @{
    email = "test@example.com"
    otp = $otpCode
} | ConvertTo-Json

Write-Host "Request body: $verifyOtpBody" -ForegroundColor Gray

try {
    $verifyResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/verify-otp" -Method POST -ContentType "application/json" -Body $verifyOtpBody
    Write-Host "OTP verification successful!" -ForegroundColor Green
    Write-Host "Message: $($verifyResponse.message)" -ForegroundColor Cyan
} catch {
    Write-Host "OTP verification failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        Write-Host "Response: $($_.Exception.Response.Content)" -ForegroundColor Red
    }
}
