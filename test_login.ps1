# Test Login API
Write-Host "Testing Login API..." -ForegroundColor Green

# Test Login with username and password
$loginBody = @{
    username = "testuser"
    password = "password123"
} | ConvertTo-Json

Write-Host "Request body: $loginBody" -ForegroundColor Gray

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
    Write-Host "Login successful!" -ForegroundColor Green
    Write-Host "Access Token: $($loginResponse.access_token)" -ForegroundColor Cyan
    Write-Host "Refresh Token: $($loginResponse.refresh_token)" -ForegroundColor Cyan
} catch {
    Write-Host "Login failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        Write-Host "Response: $($_.Exception.Response.Content)" -ForegroundColor Red
    }
}
