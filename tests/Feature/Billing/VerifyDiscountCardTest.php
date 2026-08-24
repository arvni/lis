<?php

declare(strict_types=1);

namespace Tests\Feature\Billing;

use App\Domains\Billing\Enums\DiscountCardStatus;
use App\Domains\Billing\Models\DiscountCard;
use App\Domains\Billing\Models\DiscountCardBatch;
use App\Domains\Billing\Models\DiscountPartner;
use App\Domains\Billing\Support\CardQrSigner;
use App\Domains\Laboratory\Enums\OfferType;
use App\Domains\Laboratory\Models\Offer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class VerifyDiscountCardTest extends TestCase
{
    use RefreshDatabase;

    private DiscountPartner $partner;

    private DiscountCardBatch $batch;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();

        $this->partner = DiscountPartner::create(['name' => 'Acme Corp']);
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
            'quantity' => 1,
        ]);
    }

    public function test_the_verify_page_is_reachable_without_logging_in(): void
    {
        $card = $this->card();

        $this->get(route('discount-cards.verify', ['uuid' => $card->uuid]))->assertOk();
    }

    public function test_a_valid_card_shows_its_partner_and_discount(): void
    {
        $card = $this->card();

        $response = $this->get(
            route('discount-cards.verify', [
                'uuid' => $card->uuid,
                's' => app(CardQrSigner::class)->sign($card->uuid),
            ])
        )->assertOk();

        $props = $response->viewData('page')['props'];

        $this->assertTrue($props['valid']);
        $this->assertSame('Acme Corp', $props['card']['partner']);
        $this->assertSame($card->number, $props['card']['number']);
        $this->assertSame('PERCENTAGE', $props['card']['discounts'][0]['type']);
    }

    public function test_a_revoked_card_reveals_nothing_about_the_contract(): void
    {
        $card = $this->card(['status' => DiscountCardStatus::REVOKED]);

        $response = $this->get(route('discount-cards.verify', ['uuid' => $card->uuid]))->assertOk();

        $props = $response->viewData('page')['props'];

        $this->assertFalse($props['valid']);
        $this->assertNull($props['card']);
        $this->assertStringNotContainsString('Acme Corp', json_encode($props));
    }

    public function test_an_unknown_card_is_reported_as_unrecognised(): void
    {
        $response = $this->get(
            route('discount-cards.verify', ['uuid' => Str::uuid()->toString()])
        )->assertOk();

        $props = $response->viewData('page')['props'];

        $this->assertFalse($props['valid']);
        $this->assertNull($props['card']);
    }

    public function test_a_card_uuid_with_a_forged_signature_is_rejected(): void
    {
        $card = $this->card();

        $response = $this->get(
            route('discount-cards.verify', ['uuid' => $card->uuid, 's' => 'deadbeef00'])
        )->assertOk();

        $this->assertFalse($response->viewData('page')['props']['valid']);
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
