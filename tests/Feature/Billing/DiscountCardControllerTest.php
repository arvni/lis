<?php

declare(strict_types=1);

namespace Tests\Feature\Billing;

use App\Domains\Billing\Enums\DiscountCardStatus;
use App\Domains\Billing\Models\DiscountCard;
use App\Domains\Billing\Models\DiscountCardBatch;
use App\Domains\Billing\Models\DiscountPartner;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class DiscountCardControllerTest extends TestCase
{
    use RefreshDatabase;

    private const PERMISSIONS = [
        'Billing.Discount Cards.List Discount Cards',
        'Billing.Discount Cards.Issue Discount Cards',
        'Billing.Discount Cards.Edit Discount Card',
        'Billing.Discount Cards.Revoke Discount Card',
    ];

    private DiscountPartner $partner;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();

        $this->partner = DiscountPartner::create(['name' => 'Acme Corp']);
    }

    public function test_listing_requires_permission(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('discount-cards.index'))
            ->assertForbidden();
    }

    public function test_a_permitted_user_sees_the_card_list(): void
    {
        $this->card();

        $this->actingAs($this->permittedUser())
            ->get(route('discount-cards.index'))
            ->assertOk();
    }

    public function test_issuing_requires_permission(): void
    {
        $this->actingAs(User::factory()->create())
            ->post(route('discountCards.issue'), [
                'discount_partner_id' => $this->partner->id,
                'quantity' => 5,
            ])
            ->assertForbidden();
    }

    public function test_a_permitted_user_issues_a_batch(): void
    {
        $this->actingAs($this->permittedUser())
            ->post(route('discountCards.issue'), [
                'discount_partner_id' => $this->partner->id,
                'quantity' => 5,
                'prefix' => 'ACME',
            ])
            ->assertRedirect();

        $this->assertSame(5, DiscountCard::query()->count());
    }

    public function test_a_batch_larger_than_the_cap_is_rejected(): void
    {
        $this->actingAs($this->permittedUser())
            ->post(route('discountCards.issue'), [
                'discount_partner_id' => $this->partner->id,
                'quantity' => 5001,
            ])
            ->assertSessionHasErrors('quantity');

        $this->assertSame(0, DiscountCard::query()->count());
    }

    public function test_an_expiry_in_the_past_is_rejected(): void
    {
        $this->actingAs($this->permittedUser())
            ->post(route('discountCards.issue'), [
                'discount_partner_id' => $this->partner->id,
                'quantity' => 5,
                'expires_at' => now()->subDay()->toDateString(),
            ])
            ->assertSessionHasErrors('expires_at');
    }

    public function test_activating_a_card_stamps_its_activation_time(): void
    {
        $card = $this->card(['status' => DiscountCardStatus::INACTIVE, 'activated_at' => null]);

        $this->actingAs($this->permittedUser())
            ->put(route('discount-cards.update', $card->id), [
                'status' => DiscountCardStatus::ACTIVE->value,
                'usage_limit' => 3,
            ])
            ->assertRedirect();

        $card->refresh();

        $this->assertSame(DiscountCardStatus::ACTIVE, $card->status);
        $this->assertNotNull($card->activated_at);
        $this->assertSame(3, $card->usage_limit);
    }

    public function test_a_derived_status_cannot_be_set_by_hand(): void
    {
        $card = $this->card();

        $this->actingAs($this->permittedUser())
            ->put(route('discount-cards.update', $card->id), ['status' => 'Expired'])
            ->assertSessionHasErrors('status');
    }

    public function test_revoking_kills_one_card_and_leaves_its_batch_alone(): void
    {
        $target = $this->card(['serial' => 1, 'number' => 'ACME-00001']);
        $sibling = $this->card(['serial' => 2, 'number' => 'ACME-00002']);

        $this->actingAs($this->permittedUser())
            ->post(route('discountCards.revoke', $target->id))
            ->assertRedirect();

        $this->assertSame(DiscountCardStatus::REVOKED, $target->refresh()->status);
        $this->assertSame(DiscountCardStatus::ACTIVE, $sibling->refresh()->status);
    }

    private function card(array $overrides = []): DiscountCard
    {
        $batch = DiscountCardBatch::firstOrCreate(
            ['series' => 'ACME-TEST'],
            [
                'discount_partner_id' => $this->partner->id,
                'prefix' => 'ACME',
                'quantity' => 10,
            ]
        );

        return DiscountCard::create(array_merge([
            'uuid' => Str::uuid()->toString(),
            'discount_card_batch_id' => $batch->id,
            'discount_partner_id' => $this->partner->id,
            'series' => $batch->series,
            'serial' => 1,
            'number' => 'ACME-00001',
            'status' => DiscountCardStatus::ACTIVE,
            'issued_at' => now(),
            'activated_at' => now(),
            'used_count' => 0,
        ], $overrides));
    }

    private function permittedUser(): User
    {
        $user = User::factory()->create();

        foreach (self::PERMISSIONS as $permission) {
            Permission::findOrCreate($permission);
            $user->givePermissionTo($permission);
        }
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $user;
    }
}
