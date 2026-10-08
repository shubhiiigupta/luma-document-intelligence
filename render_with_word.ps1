$ErrorActionPreference = 'Stop'
$taskRoot = $PSScriptRoot
$taskDocumentPath = Join-Path $taskRoot 'deliverables\Document_Intelligence_PRD.docx'
$taskQaPath = Join-Path $taskRoot 'deliverables\qa'
$taskPdfPath = Join-Path $taskQaPath 'Document_Intelligence_PRD.pdf'
New-Item -ItemType Directory -Path $taskQaPath -Force | Out-Null
$taskWord = $null
$taskDocument = $null
try {
    $taskWord = New-Object -ComObject Word.Application
    $taskWord.Visible = $false
    $taskWord.DisplayAlerts = 0
    $taskDocument = $taskWord.Documents.Open($taskDocumentPath, $false, $true)
    $taskDocument.Repaginate()
    $taskDocument.ExportAsFixedFormat($taskPdfPath, 17)
    Write-Output ('Verified render created: ' + $taskPdfPath)
    Write-Output ('Page count: ' + $taskDocument.ComputeStatistics(2))
} finally {
    if ($null -ne $taskDocument) { $taskDocument.Close(0) }
    if ($null -ne $taskWord) { $taskWord.Quit() }
}
