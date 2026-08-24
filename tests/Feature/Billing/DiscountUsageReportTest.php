<?php

declare(strict_types=1);

namespace Tests\Feature\Billing;

use App\Domains\Billing\Enums\DiscountCardStatus;
use App\Domains\Billing\Models\DiscountCard;
use App\Domains\Billing\Models\DiscountCardBatch;
use App\Domains\Billing\Models\DiscountCardRedemption;
use App\Domains\Billing\Models\DiscountPartner;
use App\Domains\Billing\Services\DiscountUsageReportService;
use App\Domains\Laboratory\Enums\OfferType;
use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Laboratory\Models\Method;
use App\Domains\Laboratory\Models\MethodTest;
use App\Domains\Laboratory\Models\Offer;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Models\Patient;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class DiscountUsageReportTest extends TestCase
{
    use RefreshDatabase;

    private const PERMISSION = 'Billing.Discount Cards.View Usage Report';

    private DiscountUsageReportService $service;

    private User $user;

    private Patient $patient;

    private Offer $offer;

    private Test $test;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();

        $this->service = app(DiscountUsageReportService::class);
        $this->user = User::factory()->create();
        $this->patient = Patient::create([
            'fullName' => 'Test Patient',
            'idNo' => 'TEST001',
            'nationality' => 'OM',
            'dateOfBirth' => '1990-01-01',
            'gender' => 'male',
            'registrar_id' => $this->user->id,
        ]);
        $this->test = Test::create([
            'name' => 'Covered',
            'fullName' => 'Covered Test',
            'code' => 'C1',
            'type' => TestType::TEST,
            'status' => true,
            'can_merge' => false,
        ]);
        $this->offer = Offer::create([
            'title' => 'Staff 20%',
            'description' => 'Contract discount',
            'type' => OfferType::PERCENTAGE,
            'amount' => 20,
            'active' => true,
        ]);
    }

    public function test_the_summary_adds_up_live_redemptions(): void
    {
        $partner = $this->makePartner('Acme Corp');
        $card = $this->makeCard($partner);
        $acceptance = $this->makeAcceptance($card);

        $this->redeem($card, $acceptance, 20);
        $this->redeem($card, $acceptance, 30);

        $summary = $this->service->report([])['summary'];

        $this->assertSame(50.0, $summary['total_amount']);
        $this->assertSame(1, $summary['visits']);
        $this->assertSame(2, $summary['items']);
        $this->assertSame(1, $summary['cards_used']);
        $this->assertSame(1, $summary['partners']);
    }

    public function test_a_reverted_redemption_is_left_out(): void
    {
        $partner = $this->makePartner('Acme Corp');
        $card = $this->makeCard($partner);
        $acceptance = $this->makeAcceptance($card);

        $this->redeem($card, $acceptance, 20);
        $this->redeem($card, $acceptance, 30, reverted: true);

        $summary = $this->service->report([])['summary'];

        $this->assertSame(20.0, $summary['total_amount']);
        $this->assertSame(1, $summary['items']);
    }

    public function test_redemptions_outside_the_period_are_left_out(): void
    {
        $partner = $this->makePartner('Acme Corp');
        $card = $this->makeCard($partner);
        $acceptance = $this->makeAcceptance($card);

        $this->redeem($card, $acceptance, 20, appliedAt: now()->subMonths(6));
        $this->redeem($card, $acceptance, 30);

        $summary = $this->service->report([
            'from_date' => now()->subDays(7)->toDateString(),
            'to_date' => now()->toDateString(),
        ])['summary'];

        $this->assertSame(30.0, $summary['total_amount']);
    }

    public function test_partners_are_broken_out_and_ranked_by_amount(): void
    {
        $small = $this->makePartner('Small Co');
        $big = $this->makePartner('Big Co');

        $smallCard = $this->makeCard($small);
        $bigCard = $this->makeCard($big);

        $this->redeem($smallCard, $this->makeAcceptance($smallCard), 10);
        $this->redeem($bigCard, $this->makeAcceptance($bigCard), 90);

        $partners = $this->service->report([])['partners'];

        $this->assertCount(2, $partners);
        $this->assertSame('Big Co', $partners[0]->partner_name);
        $this->assertSame(90.0, (float) $partners[0]->total_amount);
    }

    public function test_filtering_by_partner_narrows_the_report(): void
    {
        $acme = $this->makePartner('Acme Corp');
        $other = $this->makePartner('Other Co');

        $acmeCard = $this->makeCard($acme);
        $otherCard = $this->makeCard($other);

        $this->redeem($acmeCard, $this->makeAcceptance($acmeCard), 25);
        $this->redeem($otherCard, $this->makeAcceptance($otherCard), 75);

        $report = $this->service->report(['discount_partner_id' => $acme->id]);

        $this->assertSame(25.0, $report['summary']['total_amount']);
        $this->assertCount(1, $report['partners']);
    }

    public function test_the_busiest_cards_are_ranked_by_visits(): void
    {
        $partner = $this->makePartner('Acme Corp');
        $quiet = $this->makeCard($partner);
        $busy = $this->makeCard($partner);

        $this->redeem($quiet, $this->makeAcceptance($quiet), 10);
        foreach (range(1, 3) as $ignored) {
            $this->redeem($busy, $this->makeAcceptance($busy), 10);
        }

        $cards = $this->service->report([])['busiest_cards'];

        $this->assertSame($busy->id, (int) $cards[0]->card_id);
        $this->assertSame(3, (int) $cards[0]->visits);
    }

    public function test_export_rows_carry_no_patient_identity(): void
    {
        $partner = $this->makePartner('Acme Corp');
        $card = $this->makeCard($partner);
        $acceptance = $this->makeAcceptance($card);
        $this->redeem($card, $acceptance, 20);

        $rows = $this->service->rows([]);

        $this->assertCount(1, $rows);
        $this->assertSame('Acme Corp', $rows[0]->partner_name);
        $this->assertSame('Covered Test', $rows[0]->test_name);
        $this->assertStringNotContainsString('Test Patient', json_encode($rows));
    }

    public function test_the_report_page_requires_permission(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('discountUsage.index'))
            ->assertForbidden();
    }

    public function test_a_permitted_user_sees_the_report(): void
    {
        $this->actingAs($this->permittedUser())
            ->get(route('discountUsage.index'))
            ->assertOk();
    }

    public function test_an_end_date_before_the_start_date_is_rejected(): void
    {
        $this->actingAs($this->permittedUser())
            ->get(route('discountUsage.index', [
                'filters' => ['from_date' => '2026-08-31', 'to_date' => '2026-08-01'],
            ]))
            ->assertSessionHasErrors('filters.to_date');
    }

    public function test_the_export_downloads_a_spreadsheet(): void
    {
        $partner = $this->makePartner('Acme Corp');
        $card = $this->makeCard($partner);
        $this->redeem($card, $this->makeAcceptance($card), 20);

        $this->actingAs($this->permittedUser())
            ->get(route('discountUsage.export'))
            ->assertOk()
            ->assertDownload();
    }

    public function test_the_export_requires_permission(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('discountUsage.export'))
            ->assertForbidden();
    }

    private function makePartner(string $name): DiscountPartner
    {
        $partner = DiscountPartner::create(['name' => $name, 'active' => true]);
        $partner->offers()->attach($this->offer->id);

        return $partner;
    }

    private function makeCard(DiscountPartner $partner): DiscountCard
    {
        $batch = DiscountCardBatch::firstOrCreate(
            ['series' => 'S-'.$partner->id],
            ['discount_partner_id' => $partner->id, 'quantity' => 50]
        );

        return DiscountCard::create([
            'uuid' => Str::uuid()->toString(),
            'discount_card_batch_id' => $batch->id,
            'discount_partner_id' => $partner->id,
            'series' => $batch->series,
            'serial' => DiscountCard::query()->count() + 1,
            'number' => 'CARD-'.Str::upper(Str::random(6)),
            'status' => DiscountCardStatus::ACTIVE,
            'issued_at' => now(),
            'activated_at' => now(),
            'used_count' => 0,
        ]);
    }

    private function makeAcceptance(DiscountCard $card): Acceptance
    {
        return Acceptance::create([
            'patient_id' => $this->patient->id,
            'acceptor_id' => $this->user->id,
            'discount_card_id' => $card->id,
            'status' => 'pending',
            'step' => 1,
            'financial_approved' => false,
            'out_patient' => false,
            'waiting_for_pooling' => false,
        ]);
    }

    private function redeem(
        DiscountCard $card,
        Acceptance $acceptance,
        float $amount,
        bool $reverted = false,
        ?Carbon $appliedAt = null
    ): DiscountCardRedemption {
        $method = Method::create([
            'name' => 'M-'.Str::random(5),
            'price' => 100,
            'status' => true,
            'no_patient' => 1,
            'no_sample' => 1,
        ]);
        $methodTest = MethodTest::create([
            'method_id' => $method->id,
            'test_id' => $this->test->id,
            'is_default' => true,
            'status' => true,
        ]);
        $item = AcceptanceItem::create([
            'acceptance_id' => $acceptance->id,
            'method_test_id' => $methodTest->id,
            'price' => 100,
            'discount' => $amount,
        ]);

        return DiscountCardRedemption::create([
            'discount_card_id' => $card->id,
            'acceptance_id' => $acceptance->id,
            'acceptance_item_id' => $item->id,
            'offer_id' => $this->offer->id,
            'amount' => $amount,
            'applied_by' => $this->user->id,
            'applied_at' => $appliedAt ?? now(),
            'reverted_at' => $reverted ? now() : null,
        ]);
    }

    private function permittedUser(): User
    {
        $user = User::factory()->create();
        Permission::findOrCreate(self::PERMISSION);
        $user->givePermissionTo(self::PERMISSION);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $user;
    }
}
