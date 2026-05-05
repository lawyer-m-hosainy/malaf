$targetFiles = @(
    "src\views\PartnerReporting.tsx",
    "src\views\Finance.tsx",
    "src\store\useAnalyticsStore.ts"
)

$basePath = "e:\mohamay_pro-saudi-experimental"

foreach ($f in $targetFiles) {
    $fullPath = Join-Path $basePath $f
    if (Test-Path $fullPath) {
        $bytes = [System.IO.File]::ReadAllBytes($fullPath)
        $text = [System.Text.Encoding]::UTF8.GetString($bytes)
        $changed = $false
        
        if ($text.Contains('15%')) {
            $newText = $text.Replace('(15%)', '(14%)')
            $newText = $newText.Replace('15% VAT', '14% VAT')
            $newText = $newText.Replace('0.15)', '0.14)')
            $newText = $newText.Replace('0.15;', '0.14;')
            [System.IO.File]::WriteAllBytes($fullPath, [System.Text.Encoding]::UTF8.GetBytes($newText))
            Write-Host "FIXED VAT: $f"
        } else {
            Write-Host "SKIP: $f"
        }
    }
}
