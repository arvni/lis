<?php

declare(strict_types=1);

namespace Tests\Feature\Laboratory;

use App\Domains\Billing\Models\DiscountPartner;
use App\Domains\Laboratory\Enums\OfferType;
use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Laboratory\Models\Offer;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Laboratory\Services\TestService;
use App\Domains\Referrer\Models\Referrer;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * Which offers reception is allowed to see when it adds a test to an acceptance.
 *
 * Contract offers are the discounts a partner's cards buy. They are applied by
 * CardDiscountSyncService against a presented card and must never reach this
 * lookup, or a walk-in with no card would be handed the partner's discount.
 */
class OfferVisibilityTest extends TestCase
{
    use RefreshDatabase;

    private TestService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::factory()->create());
        $this->service = app(TestService::class);
    }

    public function test_a_contract_offer_is_hidden_from_a_walk_in_patient(): void
    {
        $test = $this->makeTest();
        $this->makeOffer($test, 'Acme Contract 30%', contractOnly: true);

        $loaded = $this->service->loadTest($test);

        $this->assertTrue($loaded->offers->isEmpty());
    }

    public function test_a_contract_offer_is_hidden_from_a_referred_patient(): void
    {
        $test = $this->makeTest();
        $this->makeOffer($test, 'Acme Contract 30%', contractOnly: true);

        $loaded = $this->service->loadTest($test, $this->makeReferrer()->id);

        $this->assertTrue($loaded->offers->isEmpty());
    }

    public function test_a_self_serve_offer_still_reaches_a_walk_in_patient(): void
    {
        $test = $this->makeTest();
        $offer = $this->makeOffer($test, 'Ramadan 10%', contractOnly: false);

        $loaded = $this->service->loadTest($test);

        $this->assertSame([$offer->id], $loaded->offers->pluck('id')->all());
    }

    public function test_only_the_self_serve_offer_survives_when_both_cover_the_test(): void
    {
        $test = $this->makeTest();
        $selfServe = $this->makeOffer($test, 'Ramadan 10%', contractOnly: false);
        $this->makeOffer($test, 'Acme Contract 30%', contractOnly: true);

        $loaded = $this->service->loadTest($test);

        $this->assertSame([$selfServe->id], $loaded->offers->pluck('id')->all());
    }

    public function test_a_contracted_offer_cannot_be_reopened_to_all_patients(): void
    {
        $test = $this->makeTest();
        $offer = $this->makeOffer($test, 'Acme Contract 30%', contractOnly: true);
        DiscountPartner::create(['name' => 'Acme Corp'])->offers()->attach($offer->id);

        $this->actingAs($this->offerEditor())
            ->put(route('offers.update', $offer->id), $this->offerPayload($offer, contractOnly: false))
            ->assertSessionHasErrors('contract_only');

        $this->assertTrue($offer->refresh()->contract_only);
    }

    public function test_an_uncontracted_offer_can_be_reopened_to_all_patients(): void
    {
        $test = $this->makeTest();
        $offer = $this->makeOffer($test, 'Acme Contract 30%', contractOnly: true);

        $this->actingAs($this->offerEditor())
            ->put(route('offers.update', $offer->id), $this->offerPayload($offer, contractOnly: false))
            ->assertSessionHasNoErrors();

        $this->assertFalse($offer->refresh()->contract_only);
    }

    /**
     * @return array<string, mixed>
     */
    private function offerPayload(Offer $offer, bool $contractOnly): array
    {
        return [
            'title' => $offer->title,
            'description' => $offer->description,
            'type' => $offer->type->name,
            'amount' => $offer->amount,
            'started_at' => $offer->started_at?->toDateString(),
            'ended_at' => $offer->ended_at?->toDateString(),
            'active' => true,
            'contract_only' => $contractOnly,
        ];
    }

    private function offerEditor(): User
    {
        $user = User::factory()->create();
        Permission::findOrCreate('Advance Settings.Offers.Edit Offer');
        $user->givePermissionTo('Advance Settings.Offers.Edit Offer');
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $user;
    }

    private function makeTest(): Test
    {
        return Test::create([
            'name' => 'Glucose',
            'fullName' => 'Glucose',
            'code' => 'GLU-'.uniqid(),
            'type' => TestType::TEST,
            'status' => true,
            'can_merge' => false,
        ]);
    }

    private function makeOffer(Test $test, string $title, bool $contractOnly): Offer
    {
        $offer = Offer::create([
            'title' => $title,
            'description' => 'Discount',
            'type' => OfferType::PERCENTAGE,
            'amount' => 10,
            'started_at' => now()->subDay()->toDateString(),
            'ended_at' => now()->addDay()->toDateString(),
            'active' => true,
            'contract_only' => $contractOnly,
        ]);
        $offer->tests()->attach($test->id);

        return $offer;
    }

    private function makeReferrer(): Referrer
    {
        return Referrer::create([
            'fullName' => 'Offer Visibility Referrer',
            'phoneNo' => '90000009',
            'billingInfo' => [],
            'email' => 'offer-visibility@example.com',
            'reportReceivers' => [],
        ]);
    }
}
