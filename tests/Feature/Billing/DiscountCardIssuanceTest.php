<?php

declare(strict_types=1);

namespace Tests\Feature\Billing;

use App\Domains\Billing\DTOs\IssueCardBatchDTO;
use App\Domains\Billing\Enums\DiscountCardStatus;
use App\Domains\Billing\Models\DiscountCard;
use App\Domains\Billing\Models\DiscountPartner;
use App\Domains\Billing\Services\DiscountCardIssuanceService;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DiscountCardIssuanceTest extends TestCase
{
    use RefreshDatabase;

    private DiscountCardIssuanceService $service;

    private DiscountPartner $partner;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->partner = DiscountPartner::create(['name' => 'Acme Corp']);
        $this->service = app(DiscountCardIssuanceService::class);
    }

    public function test_issuing_a_batch_creates_exactly_the_requested_number_of_cards(): void
    {
        $batch = $this->service->issue($this->dto(['quantity' => 25]), $this->user->id);

        $this->assertSame(25, $batch->quantity);
        $this->assertSame(25, DiscountCard::query()->where('discount_card_batch_id', $batch->id)->count());
    }

    public function test_every_card_gets_a_distinct_uuid_and_number(): void
    {
        $batch = $this->service->issue($this->dto(['quantity' => 30]), $this->user->id);

        $cards = DiscountCard::query()->where('discount_card_batch_id', $batch->id)->get();

        $this->assertCount(30, $cards->pluck('uuid')->unique());
        $this->assertCount(30, $cards->pluck('number')->unique());
    }

    public function test_card_numbers_are_the_series_with_a_padded_serial(): void
    {
        $batch = $this->service->issue($this->dto(['quantity' => 3]), $this->user->id);

        $numbers = DiscountCard::query()
            ->where('discount_card_batch_id', $batch->id)
            ->orderBy('serial')
            ->pluck('number')
            ->all();

        $this->assertSame([
            $batch->series.'-00001',
            $batch->series.'-00002',
            $batch->series.'-00003',
        ], $numbers);
    }

    public function test_cards_start_inactive_by_default(): void
    {
        $batch = $this->service->issue($this->dto(['quantity' => 5]), $this->user->id);

        $card = DiscountCard::query()->where('discount_card_batch_id', $batch->id)->first();

        $this->assertSame(DiscountCardStatus::INACTIVE, $card->status);
        $this->assertNull($card->activated_at);
    }

    public function test_cards_can_be_issued_already_live(): void
    {
        $batch = $this->service->issue(
            $this->dto(['quantity' => 5, 'activate_immediately' => true]),
            $this->user->id
        );

        $card = DiscountCard::query()->where('discount_card_batch_id', $batch->id)->first();

        $this->assertSame(DiscountCardStatus::ACTIVE, $card->status);
        $this->assertNotNull($card->activated_at);
    }

    public function test_batch_limits_are_stamped_onto_every_card(): void
    {
        $batch = $this->service->issue(
            $this->dto(['quantity' => 4, 'expires_at' => '2027-01-31', 'usage_limit' => 3]),
            $this->user->id
        );

        $cards = DiscountCard::query()->where('discount_card_batch_id', $batch->id)->get();

        foreach ($cards as $card) {
            $this->assertSame('2027-01-31', $card->expires_at->format('Y-m-d'));
            $this->assertSame(3, $card->usage_limit);
            $this->assertSame(0, $card->used_count);
        }
    }

    public function test_two_batches_for_the_same_partner_do_not_share_a_series(): void
    {
        $first = $this->service->issue($this->dto(['quantity' => 2]), $this->user->id);
        $second = $this->service->issue($this->dto(['quantity' => 2]), $this->user->id);

        $this->assertNotSame($first->series, $second->series);
    }

    private function dto(array $overrides = []): IssueCardBatchDTO
    {
        return IssueCardBatchDTO::fromArray(array_merge([
            'discount_partner_id' => $this->partner->id,
            'quantity' => 10,
            'prefix' => 'ACME',
        ], $overrides));
    }
}
