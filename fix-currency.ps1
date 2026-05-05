$targetFiles = @(
    "src\views\TrustAccounting.tsx",
    "src\views\TimeTracking.tsx",
    "src\views\PartnerReporting.tsx",
    "src\views\IPOperations.tsx",
    "src\views\BDDashboard.tsx",
    "src\views\Analytics.tsx",
    "src\modules\onboarding\OnboardingFlow.tsx",
    "src\modules\admin\GlobalAdmin.tsx"
)

$basePath = "e:\mohamay_pro-saudi-experimental"
$oldCurrency = [char]0x0631 + [string][char]0x002E + [char]0x0633  # ر.س
$newCurrency = [char]0x062C + [string][char]0x002E + [char]0x0645  # ج.م

foreach ($f in $targetFiles) {
    $fullPath = Join-Path $basePath $f
    if (Test-Path $fullPath) {
        $bytes = [System.IO.File]::ReadAllBytes($fullPath)
        $text = [System.Text.Encoding]::UTF8.GetString($bytes)
        if ($text.Contains($oldCurrency)) {
            $newText = $text.Replace($oldCurrency, $newCurrency)
            [System.IO.File]::WriteAllBytes($fullPath, [System.Text.Encoding]::UTF8.GetBytes($newText))
            Write-Host "FIXED: $f"
        } else {
            Write-Host "SKIP (no match): $f"
        }
    } else {
        Write-Host "NOT FOUND: $f"
    }
}
