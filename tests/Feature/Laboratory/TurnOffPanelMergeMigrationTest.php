<?php

declare(strict_types=1);

namespace Tests\Feature\Laboratory;

use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Laboratory\Models\Test;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * "Merge on Invoice" used to be ignored for panels while defaulting to on; the migration
 * switches it off for existing panels so their invoices don't change until someone opts in.
 */
class TurnOffPanelMergeMigrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_turns_merge_off_for_panels_only(): void
    {
        $panel = $this->makeTest('P', TestType::PANEL);
        $test = $this->makeTest('T', TestType::TEST);

        $migration = require database_path('migrations/2026_11_19_000001_turn_off_can_merge_for_panels.php');
        $migration->up();

        $this->assertFalse((bool) $panel->fresh()->can_merge);
        $this->assertTrue((bool) $test->fresh()->can_merge);
    }

    private function makeTest(string $code, TestType $type): Test
    {
        return Test::create([
            'name' => $code,
            'fullName' => $code,
            'code' => $code.uniqid(),
            'type' => $type,
            'status' => true,
            'can_merge' => true,
        ]);
    }
}
