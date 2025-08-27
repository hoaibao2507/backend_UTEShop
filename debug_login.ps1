# Debug Login API
Write-Host "Debugging Login API..." -ForegroundColor Green

# Test Login with username and password
$loginBody = @{
    username = "testuser"
    password = "password123"
} | ConvertTo-Json

Write-Host "Request body: $loginBody" -ForegroundColor Gray
Write-Host "Testing endpoint: http://localhost:5000/api/auth/login" -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
    Write-Host "Response Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response Content: $($response.Content)" -ForegroundColor Cyan
} catch {
    Write-Host "Error occurred:" -ForegroundColor Red
    Write-Host "Exception Type: $($_.Exception.GetType().Name)" -ForegroundColor Red
    Write-Host "Exception Message: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        Write-Host "Response Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        Write-Host "Response Content: $($_.Exception.Response.Content)" -ForegroundColor Red
    }
    
    if ($_.Exception.InnerException) {
        Write-Host "Inner Exception: $($_.Exception.InnerException.Message)" -ForegroundColor Red
    }
}
