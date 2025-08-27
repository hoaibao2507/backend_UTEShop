# Step by Step Test Script
Write-Host "Step by Step Testing..." -ForegroundColor Green

# Step 1: Check if server is running
Write-Host "`nStep 1: Checking server status..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api" -Method GET
    Write-Host "Server is running. Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "Server is not responding: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# Step 2: Check if user exists
Write-Host "`nStep 2: Checking if user exists..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/users/getAll" -Method GET
    Write-Host "Users found: $($response.Content)" -ForegroundColor Green
} catch {
    Write-Host "Failed to get users: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 3: Test login with detailed error
Write-Host "`nStep 3: Testing login..." -ForegroundColor Yellow
$loginBody = @{
    username = "testuser"
    password = "password123"
} | ConvertTo-Json

Write-Host "Login request body: $loginBody" -ForegroundColor Gray

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
    Write-Host "Login successful! Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor Cyan
} catch {
    Write-Host "Login failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        Write-Host "Response Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        Write-Host "Response Headers: $($_.Exception.Response.Headers)" -ForegroundColor Red
        
        # Try to get response content
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $content = $reader.ReadToEnd()
            Write-Host "Response Content: $content" -ForegroundColor Red
        } catch {
            Write-Host "Could not read response content: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}
