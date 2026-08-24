<?php

declare(strict_types=1);

namespace Tests\Feature\Billing;

use App\Domains\Billing\Enums\DiscountCardStatus;
use App\Domains\Billing\Models\DiscountCard;
use App\Domains\Billing\Models\DiscountCardBatch;
use App\Domains\Billing\Models\DiscountPartner;
use App\Domains\Billing\Services\DiscountCardResolver;
use App\Domains\Billing\Support\CardQrSigner;
use App\Domains\Laboratory\Enums\OfferType;
use App\Domains\Laboratory\Models\Offer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class DiscountCardResolverTest extends TestCase
{
    use RefreshDatabase;

    private DiscountCardResolver $resolver;

    private CardQrSigner $signer;

    private DiscountPartner $partner;

    private DiscountCardBatch $batch;

    protected function setUp(): void
    {
        parent::setUp();

        $this->resolver = app(DiscountCardResolver::class);
        $this->signer = app(CardQrSigner::class);

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

        $verdict = $this->resolver->resolve($card->uuid);

        $this->assertTrue($verdict->valid);
        $this->assertNull($verdict->reason);
        $this->assertSame($card->id, $verdict->card->id);
    }

    public function test_a_card_resolves_from_its_printed_number(): void
    {
        $card = $this->card();

        $this->assertTrue($this->resolver->resolve($card->number)->valid);
    }

    public function test_a_card_resolves_from_a_scanned_qr_url(): void
    {
        $card = $this->card();

        $this->assertTrue($this->resolver->resolve($this->signer->urlFor($card))->valid);
    }

    public function test_an_unknown_code_is_rejected(): void
    {
        $verdict = $this->resolver->resolve(Str::uuid()->toString());

        $this->assertFalse($verdict->valid);
        $this->assertNull($verdict->card);
    }

    public function test_a_tampered_signature_is_rejected(): void
    {
        $card = $this->card();

        $verdict = $this->resolver->resolve($card->uuid, 'deadbeef00');

        $this->assertFalse($verdict->valid);
    }

    public function test_a_revoked_card_is_rejected(): void
    {
        $card = $this->card(['status' => DiscountCardStatus::REVOKED]);

        $this->assertFalse($this->resolver->resolve($card->uuid)->valid);
    }

    public function test_a_suspended_card_is_rejected(): void
    {
        $card = $this->card(['status' => DiscountCardStatus::SUSPENDED]);

        $this->assertFalse($this->resolver->resolve($card->uuid)->valid);
    }

    public function test_a_card_not_yet_activated_is_rejected(): void
    {
        $card = $this->card(['status' => DiscountCardStatus::INACTIVE]);

        $this->assertFalse($this->resolver->resolve($card->uuid)->valid);
    }

    public function test_an_expired_card_is_rejected(): void
    {
        $card = $this->card(['expires_at' => now()->subDay()->toDateString()]);

        $this->assertFalse($this->resolver->resolve($card->uuid)->valid);
    }

    public function test_a_card_at_its_usage_limit_is_rejected(): void
    {
        $card = $this->card(['usage_limit' => 2, 'used_count' => 2]);

        $this->assertFalse($this->resolver->resolve($card->uuid)->valid);
    }

    public function test_a_card_is_rejected_when_its_contract_is_inactive(): void
    {
        $this->partner->update(['active' => false]);

        $this->assertFalse($this->resolver->resolve($this->card()->uuid)->valid);
    }

    public function test_a_card_is_rejected_when_its_contract_window_has_closed(): void
    {
        $this->partner->update(['ends_at' => now()->subDay()->toDateString()]);

        $this->assertFalse($this->resolver->resolve($this->card()->uuid)->valid);
    }

    public function test_a_card_is_rejected_when_no_offer_is_attached_to_its_contract(): void
    {
        $this->partner->offers()->detach();

        $this->assertFalse($this->resolver->resolve($this->card()->uuid)->valid);
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
