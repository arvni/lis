<?php

declare(strict_types=1);

namespace Tests\Feature\Reception;

use App\Domains\Billing\Enums\DiscountCardStatus;
use App\Domains\Billing\Models\DiscountCard;
use App\Domains\Billing\Models\DiscountCardBatch;
use App\Domains\Billing\Models\DiscountPartner;
use App\Domains\Laboratory\Enums\OfferType;
use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Laboratory\Models\Method;
use App\Domains\Laboratory\Models\MethodTest;
use App\Domains\Laboratory\Models\Offer;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Models\Patient;
use App\Domains\Reception\Services\AcceptanceItemService;
use App\Domains\Reception\Services\AcceptanceService;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class AcceptanceDiscountCardTest extends TestCase
{
    use RefreshDatabase;

    private const PERMISSIONS = [
        'Reception.Acceptances.Edit Acceptance',
        'Billing.Discount Cards.Apply To Acceptance',
    ];

    private User $user;

    private Patient $patient;

    private DiscountPartner $partner;

    private DiscountCardBatch $batch;

    private Test $test;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();

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
            'fullName' => 'Covered',
            'code' => 'C1',
            'type' => TestType::TEST,
            'status' => true,
            'can_merge' => false,
        ]);

        $this->partner = DiscountPartner::create(['name' => 'Acme Corp', 'active' => true]);
        $offer = Offer::create([
            'title' => 'Staff 20%',
            'description' => 'Contract discount',
            'type' => OfferType::PERCENTAGE,
            'amount' => 20,
            'active' => true,
        ]);
        $offer->tests()->sync([$this->test->id]);
        $this->partner->offers()->attach($offer->id);

        $this->batch = DiscountCardBatch::create([
            'discount_partner_id' => $this->partner->id,
            'series' => 'ACME-TEST',
            'quantity' => 5,
        ]);
    }

    public function test_attaching_requires_permission(): void
    {
        $acceptance = $this->makeAcceptance();

        $this->actingAs(User::factory()->create())
            ->post(route('acceptances.discountCard.store', $acceptance->id), [
                'code' => $this->makeCard()->number,
            ])
            ->assertForbidden();
    }

    public function test_a_valid_card_discounts_the_covered_item(): void
    {
        $acceptance = $this->makeAcceptance();
        $item = $this->addItem($acceptance, 100);
        $card = $this->makeCard();

        $this->actingAs($this->permittedUser())
            ->post(route('acceptances.discountCard.store', $acceptance->id), ['code' => $card->number])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertSame($card->id, $acceptance->refresh()->discount_card_id);
        $this->assertSame(20.0, (float) $item->refresh()->discount);
    }

    public function test_a_revoked_card_is_refused_and_changes_nothing(): void
    {
        $acceptance = $this->makeAcceptance();
        $item = $this->addItem($acceptance, 100);
        $card = $this->makeCard(['status' => DiscountCardStatus::REVOKED]);

        $this->actingAs($this->permittedUser())
            ->post(route('acceptances.discountCard.store', $acceptance->id), ['code' => $card->number])
            ->assertSessionHasErrors('code');

        $this->assertNull($acceptance->refresh()->discount_card_id);
        $this->assertSame(0.0, (float) $item->refresh()->discount);
    }

    public function test_an_unknown_code_is_refused(): void
    {
        $acceptance = $this->makeAcceptance();

        $this->actingAs($this->permittedUser())
            ->post(route('acceptances.discountCard.store', $acceptance->id), ['code' => 'NOPE-00001'])
            ->assertSessionHasErrors('code');

        $this->assertNull($acceptance->refresh()->discount_card_id);
    }

    public function test_detaching_removes_the_discount(): void
    {
        $acceptance = $this->makeAcceptance();
        $item = $this->addItem($acceptance, 100);
        $card = $this->makeCard();
        $user = $this->permittedUser();

        $this->actingAs($user)
            ->post(route('acceptances.discountCard.store', $acceptance->id), ['code' => $card->number]);
        $this->assertSame(20.0, (float) $item->refresh()->discount);

        $this->actingAs($user)
            ->delete(route('acceptances.discountCard.destroy', $acceptance->id))
            ->assertRedirect();

        $this->assertNull($acceptance->refresh()->discount_card_id);
        $this->assertSame(0.0, (float) $item->refresh()->discount);
    }

    public function test_a_price_change_re_syncs_the_card_discount(): void
    {
        $acceptance = $this->makeAcceptance();
        $item = $this->addItem($acceptance, 100);
        $card = $this->makeCard();

        $this->actingAs($this->permittedUser())
            ->post(route('acceptances.discountCard.store', $acceptance->id), ['code' => $card->number]);

        // Reprice through the ordinary reception path; the change event has to carry
        // the card discount along with it.
        app(AcceptanceItemService::class)->updateItemPrices(
            $acceptance->refresh(),
            [['id' => $item->id, 'price' => 200, 'discount' => 0]]
        );

        $this->assertSame(40.0, (float) $item->refresh()->discount);
    }

    public function test_cancelling_the_acceptance_gives_the_use_back(): void
    {
        $acceptance = $this->makeAcceptance();
        $this->addItem($acceptance, 100);
        $card = $this->makeCard();

        $this->actingAs($this->permittedUser())
            ->post(route('acceptances.discountCard.store', $acceptance->id), ['code' => $card->number]);
        $this->assertSame(1, $card->refresh()->used_count);

        app(AcceptanceService::class)->cancelAcceptance($acceptance->refresh());

        $this->assertSame(0, $card->refresh()->used_count);
    }

    public function test_the_resolve_endpoint_previews_a_card(): void
    {
        $card = $this->makeCard();

        $this->actingAs($this->permittedUser())
            ->getJson(route('api.discountCards.resolve', ['code' => $card->number]))
            ->assertOk()
            ->assertJsonPath('valid', true)
            ->assertJsonPath('card.partner', 'Acme Corp');
    }

    public function test_the_resolve_endpoint_requires_permission(): void
    {
        $this->actingAs(User::factory()->create())
            ->getJson(route('api.discountCards.resolve', ['code' => 'anything']))
            ->assertForbidden();
    }

    private function makeCard(array $overrides = []): DiscountCard
    {
        return DiscountCard::create(array_merge([
            'uuid' => Str::uuid()->toString(),
            'discount_card_batch_id' => $this->batch->id,
            'discount_partner_id' => $this->partner->id,
            'series' => $this->batch->series,
            'serial' => DiscountCard::query()->count() + 1,
            'number' => 'ACME-'.Str::upper(Str::random(6)),
            'status' => DiscountCardStatus::ACTIVE,
            'issued_at' => now(),
            'activated_at' => now(),
            'used_count' => 0,
        ], $overrides));
    }

    private function makeAcceptance(): Acceptance
    {
        return Acceptance::create([
            'patient_id' => $this->patient->id,
            'acceptor_id' => $this->user->id,
            'status' => 'waiting for payment',
            'step' => 3,
            'financial_approved' => false,
            'out_patient' => false,
            'waiting_for_pooling' => false,
        ]);
    }

    private function addItem(Acceptance $acceptance, float $price): AcceptanceItem
    {
        $method = Method::create([
            'name' => 'M-'.Str::random(4),
            'price' => $price,
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

        return AcceptanceItem::create([
            'acceptance_id' => $acceptance->id,
            'method_test_id' => $methodTest->id,
            'price' => $price,
            'discount' => 0,
        ]);
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
