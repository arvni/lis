<?php

declare(strict_types=1);

namespace Tests\Feature\Billing;

use App\Domains\Billing\DTOs\AssignCardsDTO;
use App\Domains\Billing\DTOs\IssueCardBatchDTO;
use App\Domains\Billing\Enums\DiscountCardStatus;
use App\Domains\Billing\Exceptions\CardsNotAssignableException;
use App\Domains\Billing\Models\DiscountCard;
use App\Domains\Billing\Models\DiscountPartner;
use App\Domains\Billing\Services\DiscountCardAssignmentService;
use App\Domains\Billing\Services\DiscountCardIssuanceService;
use App\Domains\Billing\Services\DiscountCardResolver;
use App\Domains\Billing\Support\CardNumberTemplate;
use App\Domains\Laboratory\Enums\OfferType;
use App\Domains\Laboratory\Models\Offer;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Stock cards: minted and printed with no partner behind them, then handed over
 * later either a serial range at a time or a few numbers at a time.
 */
class DiscountCardAssignmentTest extends TestCase
{
    use RefreshDatabase;

    private DiscountCardIssuanceService $issuance;

    private DiscountCardAssignmentService $assignment;

    private User $user;

    private DiscountPartner $partner;

    protected function setUp(): void
    {
        parent::setUp();

        $this->issuance = app(DiscountCardIssuanceService::class);
        $this->assignment = app(DiscountCardAssignmentService::class);
        $this->user = User::factory()->create();

        $this->partner = DiscountPartner::create(['name' => 'Acme Corp', 'active' => true]);
        $this->partner->offers()->attach(Offer::create([
            'title' => 'Staff 20%',
            'description' => 'Contract discount',
            'type' => OfferType::PERCENTAGE,
            'amount' => 20,
            'active' => true,
            'contract_only' => true,
        ])->id);
    }

    public function test_a_batch_can_be_minted_with_no_partner(): void
    {
        $batch = $this->issueStock(5);

        $this->assertNull($batch->discount_partner_id);
        $this->assertSame(5, $batch->cards()->count());
        $this->assertSame(5, $batch->cards()->whereNull('discount_partner_id')->count());
    }

    public function test_stock_cards_carry_the_template_shape(): void
    {
        $batch = $this->issueStock(10, "'LAB'-DDDD-DDDD");

        foreach ($batch->cards as $card) {
            // Exactly the template — the check character is stored beside it.
            $this->assertMatchesRegularExpression('/^LAB-\d{4}-\d{4}$/', $card->number);
        }
    }

    public function test_the_check_character_is_stored_but_kept_out_of_the_number(): void
    {
        $batch = $this->issueStock(5, 'DDDD-DDDD');

        foreach ($batch->cards as $card) {
            $this->assertMatchesRegularExpression('/^[0-9A-Z]$/', (string) $card->check_character);
            $this->assertStringNotContainsString((string) $card->check_character, substr($card->number, -1));
            $this->assertSame(
                CardNumberTemplate::checkCharacterFor($card->number),
                $card->check_character
            );
        }
    }

    public function test_a_legacy_batch_gets_no_check_character(): void
    {
        $batch = $this->issueStock(3, template: null);

        foreach ($batch->cards as $card) {
            $this->assertNull($card->check_character);
        }
    }

    public function test_minted_numbers_are_unique_across_batches_sharing_a_template(): void
    {
        $this->issueStock(60, 'DDD-DDD');
        $this->issueStock(60, 'DDD-DDD');

        $numbers = DiscountCard::query()->pluck('number');

        $this->assertCount(120, $numbers);
        $this->assertCount(120, $numbers->unique());
    }

    public function test_a_template_too_small_for_the_run_is_refused(): void
    {
        $this->expectExceptionMessageMatches('/too few|distinct numbers/');

        $this->issueStock(500, 'DD');
    }

    public function test_serials_start_where_the_batch_says(): void
    {
        $batch = $this->issueStock(3, 'DDDD-DDDD', serialFrom: 1001);

        $this->assertSame([1001, 1002, 1003], $batch->cards()->orderBy('serial')->pluck('serial')->all());
        $this->assertSame(1003, $batch->serialTo());
    }

    public function test_an_unassigned_card_discounts_nothing(): void
    {
        $card = $this->issueStock(1)->cards()->first();
        $card->update(['status' => DiscountCardStatus::ACTIVE, 'activated_at' => now()]);

        $verdict = app(DiscountCardResolver::class)->resolve($card->number);

        $this->assertFalse($verdict->valid);
        $this->assertStringContainsString('not been assigned', (string) $verdict->reason);
    }

    public function test_a_serial_range_is_assigned_to_a_partner(): void
    {
        $batch = $this->issueStock(10);

        $moved = $this->assignment->assign(new AssignCardsDTO(
            discount_partner_id: $this->partner->id,
            discount_card_batch_id: $batch->id,
            serial_from: 3,
            serial_to: 7,
        ), $this->user->id);

        $this->assertSame(5, $moved);
        $this->assertSame(5, $batch->cards()->whereNotNull('discount_partner_id')->count());
        $this->assertSame(
            [3, 4, 5, 6, 7],
            $batch->cards()->whereNotNull('discount_partner_id')->orderBy('serial')->pluck('serial')->all()
        );
    }

    public function test_individual_cards_are_assigned_one_by_one(): void
    {
        $batch = $this->issueStock(5);
        $picked = $batch->cards()->orderBy('serial')->limit(2)->pluck('id')->all();

        $moved = $this->assignment->assign(new AssignCardsDTO(
            discount_partner_id: $this->partner->id,
            card_ids: $picked,
        ), $this->user->id);

        $this->assertSame(2, $moved);
        $this->assertSame(2, $batch->cards()->whereNotNull('discount_partner_id')->count());
    }

    public function test_assignment_records_who_and_when(): void
    {
        $batch = $this->issueStock(2);

        $this->assignment->assign(new AssignCardsDTO(
            discount_partner_id: $this->partner->id,
            card_ids: $batch->cards()->pluck('id')->all(),
        ), $this->user->id);

        $card = $batch->cards()->first();
        $this->assertSame($this->user->id, $card->assigned_by);
        $this->assertNotNull($card->assigned_at);
    }

    public function test_an_assigned_card_starts_discounting(): void
    {
        $batch = $this->issueStock(1);
        $card = $batch->cards()->first();
        $card->update(['status' => DiscountCardStatus::ACTIVE, 'activated_at' => now()]);

        $this->assignment->assign(new AssignCardsDTO(
            discount_partner_id: $this->partner->id,
            card_ids: [$card->id],
        ), $this->user->id);

        $this->assertTrue(app(DiscountCardResolver::class)->resolve($card->number)->valid);
    }

    public function test_a_used_card_cannot_change_partner(): void
    {
        $batch = $this->issueStock(1);
        $card = $batch->cards()->first();
        $card->update(['discount_partner_id' => $this->partner->id, 'used_count' => 1]);

        $other = DiscountPartner::create(['name' => 'Other Co', 'active' => true]);

        $this->expectException(CardsNotAssignableException::class);
        $this->expectExceptionMessageMatches('/already been used/');

        $this->assignment->assign(new AssignCardsDTO(
            discount_partner_id: $other->id,
            card_ids: [$card->id],
        ), $this->user->id);
    }

    public function test_a_card_held_by_another_partner_is_refused(): void
    {
        $batch = $this->issueStock(1);
        $card = $batch->cards()->first();
        $card->update(['discount_partner_id' => $this->partner->id]);

        $other = DiscountPartner::create(['name' => 'Other Co', 'active' => true]);

        $this->expectException(CardsNotAssignableException::class);
        $this->expectExceptionMessageMatches('/another partner/');

        $this->assignment->assign(new AssignCardsDTO(
            discount_partner_id: $other->id,
            card_ids: [$card->id],
        ), $this->user->id);
    }

    public function test_a_released_card_goes_back_to_stock(): void
    {
        $batch = $this->issueStock(2);
        $ids = $batch->cards()->pluck('id')->all();

        $this->assignment->assign(new AssignCardsDTO($this->partner->id, card_ids: $ids), $this->user->id);
        $released = $this->assignment->release(new AssignCardsDTO($this->partner->id, card_ids: $ids), $this->user->id);

        $this->assertSame(2, $released);
        $this->assertSame(2, $batch->cards()->whereNull('discount_partner_id')->count());
        $this->assertNull($batch->cards()->first()->assigned_at);
    }

    public function test_releasing_then_reassigning_moves_a_card_between_partners(): void
    {
        $batch = $this->issueStock(1);
        $ids = $batch->cards()->pluck('id')->all();
        $other = DiscountPartner::create(['name' => 'Other Co', 'active' => true]);

        $this->assignment->assign(new AssignCardsDTO($this->partner->id, card_ids: $ids), $this->user->id);
        $this->assignment->release(new AssignCardsDTO($this->partner->id, card_ids: $ids), $this->user->id);
        $this->assignment->assign(new AssignCardsDTO($other->id, card_ids: $ids), $this->user->id);

        $this->assertSame($other->id, $batch->cards()->first()->discount_partner_id);
    }

    public function test_an_empty_selection_is_refused(): void
    {
        $this->expectException(CardsNotAssignableException::class);

        $this->assignment->assign(new AssignCardsDTO($this->partner->id, card_ids: [999999]), $this->user->id);
    }

    private function issueStock(int $quantity, ?string $template = 'DDDD-DDDD-DDDD-DDDD', int $serialFrom = 1)
    {
        return $this->issuance->issue(new IssueCardBatchDTO(
            quantity: $quantity,
            discount_partner_id: null,
            prefix: 'STOCK',
            number_template: $template,
            serial_from: $serialFrom,
        ), $this->user->id);
    }
}
