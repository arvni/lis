<?php

declare(strict_types=1);

namespace Tests\Feature\Billing;

use App\Domains\Billing\Enums\DiscountCardStatus;
use App\Domains\Billing\Models\DiscountCard;
use App\Domains\Billing\Models\DiscountCardBatch;
use App\Domains\Billing\Models\DiscountPartner;
use App\Domains\Billing\Services\DiscountCardResolver;
use App\Domains\Billing\Support\CardNumberTemplate;
use App\Domains\Laboratory\Enums\OfferType;
use App\Domains\Laboratory\Models\Offer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class DiscountCardResolverTest extends TestCase
{
    use RefreshDatabase;

    private DiscountCardResolver $resolver;

    private DiscountPartner $partner;

    private DiscountCardBatch $batch;

    protected function setUp(): void
    {
        parent::setUp();

        $this->resolver = app(DiscountCardResolver::class);

        $this->partner = DiscountPartner::create(['name' => 'Acme Corp', 'active' => true]);
        $this->partner->offers()->attach(Offer::create([
            'title' => 'Staff 20%',
            'description' => 'Contract discount',
            'type' => OfferType::PERCENTAGE,
            'amount' => 20,
            'active' => true,
        ])->id);

        $this->batch = DiscountCardBatch::create([
            'discount_partner_id' => $this->partner->id,
            'series' => 'ACME-202608-TEST',
            'prefix' => 'ACME',
            'quantity' => 1,
        ]);
    }

    public function test_an_active_card_resolves_as_valid(): void
    {
        $card = $this->card();

        $verdict = $this->resolver->resolve($card->number);

        $this->assertTrue($verdict->valid);
        $this->assertNull($verdict->reason);
        $this->assertSame($card->id, $verdict->card->id);
    }

    public function test_a_templated_number_resolves(): void
    {
        $number = CardNumberTemplate::compile('DDDD-DDDD-DDDD-DDDD')->generate();
        $card = $this->card(['number' => $number]);

        $this->assertTrue($this->resolver->resolve($number)->valid);
        $this->assertSame($card->id, $this->resolver->resolve($number)->card->id);
    }

    public function test_a_number_is_matched_however_it_is_typed(): void
    {
        $number = CardNumberTemplate::compile('LLLL-DDDD')->generate();
        $this->card(['number' => $number]);

        $this->assertTrue($this->resolver->resolve('  '.strtolower($number).' ')->valid);
    }

    public function test_a_mistyped_templated_number_is_called_out_as_mistyped(): void
    {
        $number = CardNumberTemplate::compile('DDDD-DDDD-DDDD-DDDD')->generate();
        $this->card(['number' => $number]);

        $mistyped = $number;
        $mistyped[0] = (string) ((((int) $number[0]) + 1) % 10);

        $verdict = $this->resolver->resolve($mistyped);

        $this->assertFalse($verdict->valid);
        // Told apart from "not a card" so reception knows to re-read the number.
        $this->assertStringContainsString('mistyped', (string) $verdict->reason);
    }

    public function test_an_unknown_code_is_rejected(): void
    {
        $verdict = $this->resolver->resolve(Str::uuid()->toString());

        $this->assertFalse($verdict->valid);
        $this->assertNull($verdict->card);
    }

    public function test_an_unassigned_card_is_rejected_as_unassigned(): void
    {
        $card = $this->card(['discount_partner_id' => null]);

        $verdict = $this->resolver->resolve($card->number);

        $this->assertFalse($verdict->valid);
        $this->assertStringContainsString('not been assigned', (string) $verdict->reason);
    }

    public function test_a_revoked_card_is_rejected(): void
    {
        $card = $this->card(['status' => DiscountCardStatus::REVOKED]);

        $this->assertFalse($this->resolver->resolve($card->number)->valid);
    }

    public function test_a_suspended_card_is_rejected(): void
    {
        $card = $this->card(['status' => DiscountCardStatus::SUSPENDED]);

        $this->assertFalse($this->resolver->resolve($card->number)->valid);
    }

    public function test_a_card_not_yet_activated_is_rejected(): void
    {
        $card = $this->card(['status' => DiscountCardStatus::INACTIVE]);

        $this->assertFalse($this->resolver->resolve($card->number)->valid);
    }

    public function test_an_expired_card_is_rejected(): void
    {
        $card = $this->card(['expires_at' => now()->subDay()->toDateString()]);

        $this->assertFalse($this->resolver->resolve($card->number)->valid);
    }

    public function test_a_card_at_its_usage_limit_is_rejected(): void
    {
        $card = $this->card(['usage_limit' => 2, 'used_count' => 2]);

        $this->assertFalse($this->resolver->resolve($card->number)->valid);
    }

    public function test_a_card_is_rejected_when_its_contract_is_inactive(): void
    {
        $this->partner->update(['active' => false]);

        $this->assertFalse($this->resolver->resolve($this->card()->number)->valid);
    }

    public function test_a_card_is_rejected_when_its_contract_window_has_closed(): void
    {
        $this->partner->update(['ends_at' => now()->subDay()->toDateString()]);

        $this->assertFalse($this->resolver->resolve($this->card()->number)->valid);
    }

    public function test_a_card_is_rejected_when_no_offer_is_attached_to_its_contract(): void
    {
        $this->partner->offers()->detach();

        $this->assertFalse($this->resolver->resolve($this->card()->number)->valid);
    }

    private function card(array $overrides = []): DiscountCard
    {
        return DiscountCard::create(array_merge([
            'uuid' => Str::uuid()->toString(),
            'discount_card_batch_id' => $this->batch->id,
            'discount_partner_id' => $this->partner->id,
            'series' => $this->batch->series,
            'serial' => 1,
            'number' => $this->batch->series.'-00001',
            'status' => DiscountCardStatus::ACTIVE,
            'issued_at' => now(),
            'activated_at' => now(),
            'used_count' => 0,
        ], $overrides));
    }
}
