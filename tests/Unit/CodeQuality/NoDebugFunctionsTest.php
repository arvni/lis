<?php

declare(strict_types=1);

namespace Tests\Unit\CodeQuality;

use PHPUnit\Framework\TestCase;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;

/**
 * Guards against debug/dump functions being committed under app/ (see improvement-plan #15 —
 * a stray `dd()` in a production catch block dumped PHI and 500-ed the request). Keep this in
 * sync with the frontend `no-console` ESLint rule (#6): both stop debug leftovers regressing.
 */
class NoDebugFunctionsTest extends TestCase
{
    public function test_no_debug_functions_remain_in_app_source(): void
    {
        $appPath = dirname(__DIR__, 3) . '/app';
        // Function-call forms of the die/dump helpers. Word boundaries avoid matching
        // substrings like add()/array()/ that legitimately contain these letters.
        $pattern = '/(?<![\w>$])(dd|dump|var_dump|ray)\s*\(/';

        $offenders = [];
        $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($appPath));
        foreach ($iterator as $file) {
            if ($file->isDir() || $file->getExtension() !== 'php') {
                continue;
            }

            $lines = file($file->getPathname(), FILE_IGNORE_NEW_LINES);
            foreach ($lines as $number => $line) {
                if (preg_match($pattern, $line)) {
                    $relative = str_replace($appPath . '/', 'app/', $file->getPathname());
                    $offenders[] = $relative . ':' . ($number + 1) . '  ' . trim($line);
                }
            }
        }

        $this->assertSame(
            [],
            $offenders,
            "Debug functions (dd/dump/var_dump/ray) must not appear in app/ source:\n" . implode("\n", $offenders)
        );
    }
}
