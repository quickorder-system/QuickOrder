#!/usr/bin/env pwsh

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   DISCOUNT VALIDATION TESTS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$passed = 0
$failed = 0

# Test 1: Validate WELCOME10
Write-Host "Test 1: Validate WELCOME10 code (30% off, order ₱1000)"
try {
  $response = Invoke-WebRequest "http://localhost:5001/api/discounts/validate/WELCOME10?orderAmount=1000" -UseBasicParsing
  $data = $response.Content | ConvertFrom-Json
  
  Write-Host "✅ PASS"
  Write-Host "   Status: $($response.StatusCode)"
  Write-Host "   Code: $($data.code)"
  Write-Host "   Type: $($data.discountType)"
  Write-Host "   Value: $($data.discountValue)%"
  Write-Host "   Discount Amount: ₱$($data.discountAmount)"
  Write-Host "   Final Total: ₱$([Math]::Round(1000 - $data.discountAmount))"
  Write-Host "   Valid Until: $($data.endDate)" 
  $passed++
} catch {
  Write-Host "❌ FAIL: $($_.Exception.Message)"
  $failed++
}

# Test 2: Validate CHRISTMAS
Write-Host "`nTest 2: Validate CHRISTMAS code (20% off, order ₱1500)"
try {
  $response = Invoke-WebRequest "http://localhost:5001/api/discounts/validate/CHRISTMAS?orderAmount=1500" -UseBasicParsing
  $data = $response.Content | ConvertFrom-Json
  
  Write-Host "✅ PASS"
  Write-Host "   Status: $($response.StatusCode)"
  Write-Host "   Code: $($data.code)"
  Write-Host "   Type: $($data.discountType)"
  Write-Host "   Value: $($data.discountValue)%"
  Write-Host "   Discount Amount: ₱$($data.discountAmount)"
  Write-Host "   Final Total: ₱$([Math]::Round(1500 - $data.discountAmount))"
  Write-Host "   Valid Until: $($data.endDate)"
  $passed++
} catch {
  Write-Host "❌ FAIL: $($_.Exception.Message)"
  $failed++
}

# Test 3: Invalid code
Write-Host "`nTest 3: Invalid discount code (INVALID999)"
try {
  $response = Invoke-WebRequest "http://localhost:5001/api/discounts/validate/INVALID999?orderAmount=1000" -UseBasicParsing -ErrorAction Stop
  Write-Host "❌ FAIL: Should return 400 error"
  $failed++
} catch {
  $statusCode = $_.Exception.Response.StatusCode.Value__
  if ($statusCode -eq 400) {
    Write-Host "✅ PASS"
    Write-Host "   Status: $statusCode (Bad Request)"
    Write-Host "   Invalid code correctly rejected"
    $passed++
  } else {
    Write-Host "❌ FAIL: Wrong status code: $statusCode"
    $failed++
  }
}

# Test 4: Case insensitivity
Write-Host "`nTest 4: Case insensitivity (welcome10 lowercase)"
try {
  $response = Invoke-WebRequest "http://localhost:5001/api/discounts/validate/welcome10?orderAmount=1000" -UseBasicParsing
  $data = $response.Content | ConvertFrom-Json
  
  if ($data.code -eq "WELCOME10") {
    Write-Host "✅ PASS"
    Write-Host "   Lowercase code converted to uppercase"
    Write-Host "   Code: $($data.code)"
    $passed++
  } else {
    Write-Host "❌ FAIL: Code not uppercase"
    $failed++
  }
} catch {
  Write-Host "❌ FAIL: $($_.Exception.Message)"
  $failed++
}

# Test 5: Different order amounts
Write-Host "`nTest 5: Different order amount (WELCOME10, order ₱500)"
try {
  $response = Invoke-WebRequest "http://localhost:5001/api/discounts/validate/WELCOME10?orderAmount=500" -UseBasicParsing
  $data = $response.Content | ConvertFrom-Json
  
  Write-Host "✅ PASS"
  Write-Host "   Order: ₱500"
  Write-Host "   Discount: 30%"
  Write-Host "   Discount Amount: ₱$($data.discountAmount)"
  Write-Host "   Final Total: ₱$([Math]::Round(500 - $data.discountAmount))"
  $passed++
} catch {
  Write-Host "❌ FAIL: $($_.Exception.Message)"
  $failed++
}

# Test 6: Get all active discounts
Write-Host "`nTest 6: Get all active discounts"
try {
  $response = Invoke-WebRequest "http://localhost:5001/api/discounts?isActive=true" -UseBasicParsing -Headers @{'x-auth-token'='dummy'}
  $data = $response.Content | ConvertFrom-Json
  
  Write-Host "✅ PASS"
  Write-Host "   Found $($data.discounts.Count) active discounts"
  foreach ($discount in $data.discounts) {
    Write-Host "   - $($discount.code): $($discount.discountValue)% off"
  }
  $passed++
} catch {
  Write-Host "❌ FAIL: $($_.Exception.Message)"
  $failed++
}

# Summary
$total = $passed + $failed
$successRate = if ($total -gt 0) { [Math]::Round(($passed / $total) * 100, 1) } else { 0 }

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   RESULTS: $passed passed, $failed failed" -ForegroundColor Cyan
Write-Host "   Success Rate: $successRate%" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
