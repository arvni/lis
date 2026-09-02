<?php

declare(strict_types=1);

namespace Tests\Feature\Reception;

use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Laboratory\Models\Method;
use App\Domains\Laboratory\Models\MethodTest;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Models\Patient;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * The repair for items already carrying a discount above their own price. It runs
 * once on deploy against rows no fixture can produce any more, so it is pinned
 * here against hand-written damage.
 */
class RebalanceItemDiscountsMigrationTest extends TestCase
{
    use RefreshDatabase;

    private Acceptance $acceptance;

    private int $methodTestId;

    public function test_it_leaves_no_item_discounted_past_its_own_price(): void
    {
        $panelId = (string) Str::uuid();

        // A 10 panel split 4/3/3 against a 100% discount split in thousandths.
        $first = $this->makeItem(price: 4, discount: 3.334, panelId: $panelId);
        $second = $this->makeItem(price: 3, discount: 3.333, panelId: $panelId);
        $third = $this->makeItem(price: 3, discount: 3.333, panelId: $panelId);
        $standalone = $this->makeItem(price: 5, discount: 7.5);
        $trashed = $this->makeItem(price: 2, discount: 9);
        $trashed->delete();

        $this->runMigration();

        // The panel gives away the same 10 it always did — only the split moved,
        // so nothing downstream of the panel total has to be recomposed.
        $panelDiscounts = AcceptanceItem::whereIn('id', [$first->id, $second->id, $third->id])
            ->orderBy('id')
            ->pluck('discount')
            ->map(static fn ($discount): float => (float) $discount)
            ->all();

        $this->assertSame([4.0, 3.0, 3.0], $panelDiscounts);
        $this->assertSame(10.0, array_sum($panelDiscounts));

        // Nothing to hand the excess to: capping is the only repair available.
        $this->assertSame(5.0, (float) $standalone->refresh()->discount);
        $this->assertSame(2.0, (float) AcceptanceItem::withTrashed()->findOrFail($trashed->id)->discount);

        $this->assertSame(0, DB::table('acceptance_items')->whereColumn('discount', '>', 'price')->count());
    }

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::factory()->create());

        $patient = Patient::create([
            'fullName' => 'Repair Patient',
            'idNo' => 'REP'.Str::random(6),
            'nationality' => 'OM',
            'dateOfBirth' => '1990-01-01',
            'gender' => 'male',
            'registrar_id' => auth()->id(),
        ]);

        $this->acceptance = Acceptance::create([
            'status' => AcceptanceStatus::PROCESSING,
            'step' => 5,
            'patient_id' => $patient->id,
            'acceptor_id' => auth()->id(),
            'financial_approved' => false,
            'out_patient' => false,
            'waiting_for_pooling' => false,
        ]);

        $test = Test::create(['name' => 'Rep', 'fullName' => 'Rep', 'code' => 'REP'.uniqid(), 'type' => TestType::TEST, 'status' => true, 'can_merge' => false]);
        $method = Method::create(['name' => 'Rep', 'price' => 0, 'turnaround_time' => 1, 'status' => true, 'no_patient' => 1, 'no_sample' => 1]);
        $this->methodTestId = MethodTest::create(['method_id' => $method->id, 'test_id' => $test->id, 'is_default' => true, 'status' => true])->id;
    }

    private function makeItem(float $price, float $discount, ?string $panelId = null): AcceptanceItem
    {
        return AcceptanceItem::create([
            'acceptance_id' => $this->acceptance->id,
            'method_test_id' => $this->methodTestId,
            'panel_id' => $panelId,
            'price' => $price,
            'discount' => $discount,
            'reportless' => false,
            'sampleless' => false,
            'no_sample' => 1,
            'customParameters' => [],
            'timeline' => [],
        ]);
    }

    private function runMigration(): void
    {
        (require database_path('migrations/2026_09_02_000002_rebalance_item_discounts_above_price.php'))->up();
    }
}
