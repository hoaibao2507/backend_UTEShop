# Test API Script
Write-Host "Testing UTEShop API..." -ForegroundColor Green

# Test Register
Write-Host "`n1. Testing Register API..." -ForegroundColor Yellow
$registerBody = @{
    name = "Test User"
    username = "testuser"
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "http://localhost:5000/auth/register" -Method POST -ContentType "application/json" -Body $registerBody
    Write-Host "Register successful!" -ForegroundColor Green
    Write-Host "User ID: $($registerResponse.id)" -ForegroundColor Cyan
    Write-Host "OTP sent to email: $($registerResponse.email)" -ForegroundColor Cyan
} catch {
    Write-Host "Register failed: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# Test Verify OTP
Write-Host "`n2. Testing Verify OTP API..." -ForegroundColor Yellow
Write-Host "Please enter the OTP code from your email:" -ForegroundColor Cyan
$otpCode = Read-Host

$verifyOtpBody = @{
    email = "test@example.com"
    otp = $otpCode
} | ConvertTo-Json

try {
    $verifyResponse = Invoke-RestMethod -Uri "http://localhost:5000/auth/verify-otp" -Method POST -ContentType "application/json" -Body $verifyOtpBody
    Write-Host "OTP verification successful!" -ForegroundColor Green
    Write-Host "Message: $($verifyResponse.message)" -ForegroundColor Cyan
} catch {
    Write-Host "OTP verification failed: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# Test Login (should succeed now that user is verified)
Write-Host "`n3. Testing Login API (should succeed now)..." -ForegroundColor Yellow
$loginBody = @{
    username = "testuser"
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
    Write-Host "Login successful!" -ForegroundColor Green
    Write-Host "Access Token: $($loginResponse.access_token)" -ForegroundColor Cyan
    Write-Host "Refresh Token: $($loginResponse.refresh_token)" -ForegroundColor Cyan
} catch {
    Write-Host "Login failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nTest completed!" -ForegroundColor Green
