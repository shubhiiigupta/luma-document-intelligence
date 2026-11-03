import test from 'node:test'
import assert from 'node:assert/strict'
import { validateFile, safeFileName, MAX_FILE_SIZE } from './fileRules.ts'

test('rejects files that cannot be safely accepted by this milestone', () => {
  for (const name of ['malware.exe', 'report.pdf.exe', 'no-extension']) {
    assert.throws(() => validateFile(name, 100))
  }
  assert.throws(() => validateFile('empty.txt', 0))
  assert.throws(() => validateFile('large.pdf', MAX_FILE_SIZE + 1))
  assert.equal(validateFile('REPORT.PDF', MAX_FILE_SIZE), 'application/pdf')
})
test('untrusted names cannot introduce another storage folder', () => {
  for (const name of ['../../private.txt', 'folder\\secret.md', '<script>alert(1)</script>.txt', '研究.pdf']) {
    const safe = safeFileName(name)
    assert.doesNotMatch(safe, /[\\/<>]/)
    assert.match(safe, /\.(txt|md|pdf)$/)
    assert.ok(safe.length <= 124)
  }
})
