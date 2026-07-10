<?php

declare(strict_types=1);

namespace Tests\Unit\CodeQuality;

use PHPUnit\Framework\TestCase;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;

/**
 * Ratchet for the `declare(strict_types=1)` rule (improvement-plan #35). The legacy files that
 * predate enforcement are frozen in strict-types-legacy-allowlist.txt; every file NOT on that
 * list must declare strict_types. The list may only shrink: when you add the declare to a legacy
 * file (do so whenever you touch one), remove its line from the allowlist in the same commit.
 */
class StrictTypesTest extends TestCase
{
    private const ALLOWLIST = __DIR__.'/strict-types-legacy-allowlist.txt';

    private const DECLARE_PATTERN = '/declare\s*\(\s*strict_types\s*=\s*1\s*\)/';

    public function test_files_outside_the_legacy_allowlist_declare_strict_types(): void
    {
        $allowlist = array_flip($this->allowlist());

        $offenders = [];
        foreach ($this->appPhpFiles() as $relative => $path) {
            if (isset($allowlist[$relative])) {
                continue;
            }
            if (! preg_match(self::DECLARE_PATTERN, (string) file_get_contents($path))) {
                $offenders[] = $relative;
            }
        }

        $this->assertSame(
            [],
            $offenders,
            "New app/ files must start with `declare(strict_types=1);`:\n".implode("\n", $offenders)
        );
    }

    public function test_legacy_allowlist_only_shrinks(): void
    {
        $files = $this->appPhpFiles();

        $stale = [];
        foreach ($this->allowlist() as $relative) {
            if (! isset($files[$relative])) {
                $stale[] = $relative.'  (file no longer exists)';
            } elseif (preg_match(self::DECLARE_PATTERN, (string) file_get_contents($files[$relative]))) {
                $stale[] = $relative.'  (now declares strict_types — progress! remove its allowlist line)';
            }
        }

        $this->assertSame(
            [],
            $stale,
            "Remove these lines from strict-types-legacy-allowlist.txt:\n".implode("\n", $stale)
        );
    }

    /** @return list<string> */
    private function allowlist(): array
    {
        $lines = file(self::ALLOWLIST, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        $this->assertNotFalse($lines, 'Missing '.self::ALLOWLIST);

        return $lines;
    }

    /** @return array<string, string> relative path (app/...) => absolute path */
    private function appPhpFiles(): array
    {
        $appPath = dirname(__DIR__, 3).'/app';

        $files = [];
        $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($appPath));
        foreach ($iterator as $file) {
            if ($file->isDir() || $file->getExtension() !== 'php') {
                continue;
            }
            $relative = str_replace($appPath.'/', 'app/', $file->getPathname());
            $files[$relative] = $file->getPathname();
        }
        ksort($files);

        return $files;
    }
}
