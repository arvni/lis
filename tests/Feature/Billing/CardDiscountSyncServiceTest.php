<?php

declare(strict_types=1);

namespace Tests\Feature\Billing;

use App\Domains\Billing\Enums\DiscountCardStatus;
use App\Domains\Billing\Enums\InvoiceStatus;
use App\Domains\Billing\Models\DiscountCard;
use App\Domains\Billing\Models\DiscountCardBatch;
use App\Domains\Billing\Models\DiscountCardRedemption;
use App\Domains\Billing\Models\DiscountPartner;
use App\Domains\Billing\Models\Invoice;
use App\Domains\Billing\Services\CardDiscountSyncService;
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
use Illuminate\Support\Str;
use Tests\TestCase;

class CardDiscountSyncServiceTest extends TestCase
{
    use RefreshDatabase;

    private CardDiscountSyncService $service;

    private User $user;

    private Patient $patient;

    private DiscountPartner $partner;

    private DiscountCardBatch $batch;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = app(CardDiscountSyncService::class);
        $this->user = User::factory()->create();
        $this->patient = Patient::create([
            'fullName' => 'Test Patient',
            'idNo' => 'TEST001',
            'nationality' => 'OM',
            'dateOfBirth' => '1990-01-01',
            'gender' => 'male',
            'registrar_id' => $this->user->id,
        ]);

        $this->partner = DiscountPartner::create(['name' => 'Acme Corp', 'active' => true]);
        $this->batch = DiscountCardBatch::create([
            'discount_partner_id' => $this->partner->id,
            'series' => 'ACME-TEST',
            'quantity' => 5,
        ]);
    }

    public function test_a_percentage_offer_discounts_only_the_tests_it_covers(): void
    {
        $covered = $this->makeTest('Covered', 'C1');
        $uncovered = $this->makeTest('Uncovered', 'U1');
        $this->attachOffer($this->makeOffer(OfferType::PERCENTAGE, 20, [$covered]));

        $acceptance = $this->makeAcceptance();
        $coveredItem = $this->addItem($acceptance, $covered, 100);
        $uncoveredItem = $this->addItem($acceptance, $uncovered, 100);

        $this->service->sync($acceptance, $this->user->id);

        $this->assertSame(20.0, (float) $coveredItem->refresh()->discount);
        $this->assertSame(0.0, (float) $uncoveredItem->refresh()->discount);
    }

    public function test_a_fixed_offer_never_exceeds_the_item_price(): void
    {
        $test = $this->makeTest('Cheap', 'C1');
        $this->attachOffer($this->makeOffer(OfferType::FIXED, 500, [$test]));

        $acceptance = $this->makeAcceptance();
        $item = $this->addItem($acceptance, $test, 30);

        $this->service->sync($acceptance, $this->user->id);

        $this->assertSame(30.0, (float) $item->refresh()->discount);
    }

    public function test_the_discount_line_records_where_it_came_from(): void
    {
        $test = $this->makeTest('Covered', 'C1');
        $offer = $this->makeOffer(OfferType::PERCENTAGE, 25, [$test]);
        $this->attachOffer($offer);

        $acceptance = $this->makeAcceptance();
        $item = $this->addItem($acceptance, $test, 200);

        $this->service->sync($acceptance, $this->user->id);

        $line = $item->refresh()->customParameters['discounts'][0];

        $this->assertSame('CARD', $line['source']);
        $this->assertSame($offer->id, $line['offer_id']);
        $this->assertSame(50.0, (float) $line['amount']);
        $this->assertSame('PERCENTAGE', $line['type']);
    }

    public function test_a_card_discount_replaces_a_manual_one_and_gives_it_back_on_removal(): void
    {
        $test = $this->makeTest('Covered', 'C1');
        $this->attachOffer($this->makeOffer(OfferType::PERCENTAGE, 20, [$test]));

        $acceptance = $this->makeAcceptance();
        $item = $this->addItem($acceptance, $test, 100, discount: 10, customParameters: [
            'discounts' => [['id' => 1, 'type' => 'FIXED', 'value' => 10, 'reason' => 'Goodwill']],
        ]);

        $this->service->sync($acceptance, $this->user->id);
        $item->refresh();

        $this->assertSame(20.0, (float) $item->discount);
        $this->assertCount(1, $item->customParameters['discounts']);
        $this->assertSame('CARD', $item->customParameters['discounts'][0]['source']);

        // Card comes off: the manual line it displaced comes back untouched.
        $acceptance->update(['discount_card_id' => null]);
        $this->service->sync($acceptance->refresh(), $this->user->id);
        $item->refresh();

        $this->assertSame(10.0, (float) $item->discount);
        $this->assertSame('Goodwill', $item->customParameters['discounts'][0]['reason']);
        $this->assertArrayNotHasKey('discounts_suppressed_by_card', $item->customParameters);
    }

    public function test_a_manual_discount_on_an_uncovered_item_is_left_alone(): void
    {
        $covered = $this->makeTest('Covered', 'C1');
        $uncovered = $this->makeTest('Uncovered', 'U1');
        $this->attachOffer($this->makeOffer(OfferType::PERCENTAGE, 20, [$covered]));

        $acceptance = $this->makeAcceptance();
        $this->addItem($acceptance, $covered, 100);
        $manualItem = $this->addItem($acceptance, $uncovered, 100, discount: 15, customParameters: [
            'discounts' => [['id' => 1, 'type' => 'FIXED', 'value' => 15, 'reason' => 'Goodwill']],
        ]);

        $this->service->sync($acceptance, $this->user->id);

        $this->assertSame(15.0, (float) $manualItem->refresh()->discount);
    }

    public function test_syncing_twice_changes_nothing_the_second_time(): void
    {
        $test = $this->makeTest('Covered', 'C1');
        $this->attachOffer($this->makeOffer(OfferType::PERCENTAGE, 20, [$test]));

        $acceptance = $this->makeAcceptance();
        $item = $this->addItem($acceptance, $test, 100);

        $this->service->sync($acceptance, $this->user->id);
        $first = $item->refresh()->customParameters;

        $this->service->sync($acceptance->refresh(), $this->user->id);

        $this->assertSame(20.0, (float) $item->refresh()->discount);
        $this->assertEquals($first, $item->refresh()->customParameters);
        $this->assertSame(1, $item->refresh()->acceptance->discountCard->redemptions()->count());
    }

    public function test_the_per_acceptance_cap_limits_the_whole_acceptance(): void
    {
        $test = $this->makeTest('Covered', 'C1');
        $offer = $this->makeOffer(OfferType::PERCENTAGE, 50, [$test]);
        $offer->update(['max_amount_per_acceptance' => 60]);
        $this->attachOffer($offer);

        $acceptance = $this->makeAcceptance();
        $first = $this->addItem($acceptance, $test, 100);
        $second = $this->addItem($acceptance, $test, 100);

        $this->service->sync($acceptance, $this->user->id);

        $this->assertSame(50.0, (float) $first->refresh()->discount);
        $this->assertSame(10.0, (float) $second->refresh()->discount);
    }

    public function test_the_best_offer_wins_and_offers_never_stack(): void
    {
        $test = $this->makeTest('Covered', 'C1');
        $this->attachOffer($this->makeOffer(OfferType::PERCENTAGE, 10, [$test]));
        $this->attachOffer($this->makeOffer(OfferType::PERCENTAGE, 30, [$test]));

        $acceptance = $this->makeAcceptance();
        $item = $this->addItem($acceptance, $test, 100);

        $this->service->sync($acceptance, $this->user->id);
        $item->refresh();

        $this->assertSame(30.0, (float) $item->discount);
        $this->assertCount(1, $item->customParameters['discounts']);
    }

    public function test_an_expired_card_stops_discounting(): void
    {
        $test = $this->makeTest('Covered', 'C1');
        $this->attachOffer($this->makeOffer(OfferType::PERCENTAGE, 20, [$test]));

        $acceptance = $this->makeAcceptance(['expires_at' => now()->subDay()->toDateString()]);
        $item = $this->addItem($acceptance, $test, 100);

        $this->service->sync($acceptance, $this->user->id);

        $this->assertSame(0.0, (float) $item->refresh()->discount);
    }

    public function test_an_expired_offer_stops_discounting(): void
    {
        $test = $this->makeTest('Covered', 'C1');
        $offer = $this->makeOffer(OfferType::PERCENTAGE, 20, [$test]);
        $offer->update(['ended_at' => now()->subDay()->toDateString()]);
        $this->attachOffer($offer);

        $acceptance = $this->makeAcceptance();
        $item = $this->addItem($acceptance, $test, 100);

        $this->service->sync($acceptance, $this->user->id);

        $this->assertSame(0.0, (float) $item->refresh()->discount);
    }

    public function test_a_paid_invoice_is_never_re_discounted(): void
    {
        $test = $this->makeTest('Covered', 'C1');
        $this->attachOffer($this->makeOffer(OfferType::PERCENTAGE, 20, [$test]));

        $invoice = Invoice::create([
            'owner_type' => 'patient',
            'owner_id' => $this->patient->id,
            'user_id' => $this->user->id,
            'status' => InvoiceStatus::PAID,
            'discount' => 0,
        ]);
        $acceptance = $this->makeAcceptance([], ['invoice_id' => $invoice->id]);
        $item = $this->addItem($acceptance, $test, 100);

        $this->service->sync($acceptance, $this->user->id);

        $this->assertSame(0.0, (float) $item->refresh()->discount);
    }

    public function test_a_redemption_is_ledgered_per_discounted_item(): void
    {
        $test = $this->makeTest('Covered', 'C1');
        $this->attachOffer($this->makeOffer(OfferType::PERCENTAGE, 20, [$test]));

        $acceptance = $this->makeAcceptance();
        $this->addItem($acceptance, $test, 100);
        $this->addItem($acceptance, $test, 50);

        $this->service->sync($acceptance, $this->user->id);

        $this->assertDatabaseCount('discount_card_redemptions', 2);
        // One visit counts as one use however many of its tests were discounted.
        $this->assertSame(1, $acceptance->discountCard->refresh()->used_count);
    }

    public function test_removing_an_item_reverts_only_its_redemption(): void
    {
        $test = $this->makeTest('Covered', 'C1');
        $this->attachOffer($this->makeOffer(OfferType::PERCENTAGE, 20, [$test]));

        $acceptance = $this->makeAcceptance();
        $kept = $this->addItem($acceptance, $test, 100);
        $removed = $this->addItem($acceptance, $test, 50);

        $this->service->sync($acceptance, $this->user->id);
        $removed->delete();
        $this->service->sync($acceptance->refresh(), $this->user->id);

        $this->assertDatabaseHas('discount_card_redemptions', [
            'acceptance_item_id' => $kept->id,
            'reverted_at' => null,
        ]);
        $this->assertNotNull(
            DiscountCardRedemption::query()
                ->where('acceptance_item_id', $removed->id)
                ->value('reverted_at')
        );
    }

    public function test_a_single_use_card_keeps_working_across_re_syncs_of_its_own_acceptance(): void
    {
        $test = $this->makeTest('Covered', 'C1');
        $this->attachOffer($this->makeOffer(OfferType::PERCENTAGE, 20, [$test]));

        $acceptance = $this->makeAcceptance(['usage_limit' => 1]);
        $item = $this->addItem($acceptance, $test, 100);

        $this->service->sync($acceptance, $this->user->id);
        $this->assertSame(20.0, (float) $item->refresh()->discount);

        // Re-syncing the same visit must not read the card's own use as the limit
        // being spent, or the discount would vanish the moment anything changed.
        $this->service->sync($acceptance->refresh(), $this->user->id);

        $this->assertSame(20.0, (float) $item->refresh()->discount);
    }

    public function test_a_spent_card_does_not_discount_a_second_acceptance(): void
    {
        $test = $this->makeTest('Covered', 'C1');
        $this->attachOffer($this->makeOffer(OfferType::PERCENTAGE, 20, [$test]));

        $first = $this->makeAcceptance(['usage_limit' => 1]);
        $this->addItem($first, $test, 100);
        $this->service->sync($first, $this->user->id);

        $second = Acceptance::create([
            'patient_id' => $this->patient->id,
            'acceptor_id' => $this->user->id,
            'discount_card_id' => $first->discount_card_id,
            'status' => 'pending',
            'step' => 1,
            'financial_approved' => false,
            'out_patient' => false,
            'waiting_for_pooling' => false,
        ]);
        $secondItem = $this->addItem($second, $test, 100);

        $this->service->sync($second, $this->user->id);

        $this->assertSame(0.0, (float) $secondItem->refresh()->discount);
    }

    public function test_reverting_everything_gives_the_use_back_to_the_card(): void
    {
        $test = $this->makeTest('Covered', 'C1');
        $this->attachOffer($this->makeOffer(OfferType::PERCENTAGE, 20, [$test]));

        $acceptance = $this->makeAcceptance();
        $this->addItem($acceptance, $test, 100);

        $this->service->sync($acceptance, $this->user->id);
        $this->assertSame(1, $acceptance->discountCard->refresh()->used_count);

        $this->service->revertAll($acceptance, 'Acceptance cancelled');

        $this->assertSame(0, $acceptance->discountCard->refresh()->used_count);
    }

    private function makeOffer(OfferType $type, float $amount, array $tests): Offer
    {
        $offer = Offer::create([
            'title' => 'Contract '.$type->name.' '.$amount,
            'description' => 'Contract discount',
            'type' => $type,
            'amount' => $amount,
            'active' => true,
        ]);
        $offer->tests()->sync(collect($tests)->pluck('id')->all());

        return $offer;
    }

    private function attachOffer(Offer $offer): void
    {
        $this->partner->offers()->attach($offer->id);
    }

    private function makeCard(array $overrides = []): DiscountCard
    {
        return DiscountCard::create(array_merge([
            'uuid' => Str::uuid()->toString(),
            'discount_card_batch_id' => $this->batch->id,
            'discount_partner_id' => $this->partner->id,
            'series' => $this->batch->series,
            'serial' => DiscountCard::query()->count() + 1,
            'number' => 'ACME-'.Str::random(6),
            'status' => DiscountCardStatus::ACTIVE,
            'issued_at' => now(),
            'activated_at' => now(),
            'used_count' => 0,
        ], $overrides));
    }

    private function makeAcceptance(array $cardOverrides = [], array $overrides = []): Acceptance
    {
        return Acceptance::create(array_merge([
            'patient_id' => $this->patient->id,
            'acceptor_id' => $this->user->id,
            'discount_card_id' => $this->makeCard($cardOverrides)->id,
            'status' => 'pending',
            'step' => 1,
            'financial_approved' => false,
            'out_patient' => false,
            'waiting_for_pooling' => false,
        ], $overrides));
    }

    private function makeTest(string $name, string $code): Test
    {
        return Test::create([
            'name' => $name,
            'fullName' => $name,
            'code' => $code,
            'type' => TestType::TEST,
            'status' => true,
            'can_merge' => false,
        ]);
    }

    private function addItem(
        Acceptance $acceptance,
        Test $test,
        float $price,
        float $discount = 0,
        ?array $customParameters = null
    ): AcceptanceItem {
        $method = Method::create([
            'name' => 'M-'.$test->code.'-'.Str::random(4),
            'price' => $price,
            'status' => true,
            'no_patient' => 1,
            'no_sample' => 1,
        ]);
        $methodTest = MethodTest::create([
            'method_id' => $method->id,
            'test_id' => $test->id,
            'is_default' => true,
            'status' => true,
        ]);

        return AcceptanceItem::create([
            'acceptance_id' => $acceptance->id,
            'method_test_id' => $methodTest->id,
            'price' => $price,
            'discount' => $discount,
            'customParameters' => $customParameters,
        ]);
    }
}
