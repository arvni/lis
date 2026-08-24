<?php

declare(strict_types=1);

namespace Tests\Feature\Billing;

use App\Domains\Billing\Models\DiscountPartner;
use App\Domains\Laboratory\Enums\OfferType;
use App\Domains\Laboratory\Models\Offer;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class DiscountPartnerControllerTest extends TestCase
{
    use RefreshDatabase;

    private const PERMISSIONS = [
        'Billing.Discount Partners.List Discount Partners',
        'Billing.Discount Partners.Create Discount Partner',
        'Billing.Discount Partners.Edit Discount Partner',
        'Billing.Discount Partners.Delete Discount Partner',
    ];

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    public function test_listing_requires_permission(): void
    {
        $this->actingAs(User::factory()->create())
            ->get(route('discount-partners.index'))
            ->assertForbidden();
    }

    public function test_a_permitted_user_sees_the_partner_list(): void
    {
        DiscountPartner::create(['name' => 'Acme Corp']);

        $this->actingAs($this->permittedUser())
            ->get(route('discount-partners.index'))
            ->assertOk();
    }

    public function test_a_partner_is_created_with_its_offers_attached(): void
    {
        $offer = $this->offer();

        $this->actingAs($this->permittedUser())
            ->post(route('discount-partners.store'), [
                'name' => 'Acme Corp',
                'contract_no' => 'C-2026-01',
                'contact' => ['person' => 'Jo', 'phone' => '99887766'],
                'starts_at' => '2026-01-01',
                'ends_at' => '2026-12-31',
                'active' => true,
                'offers' => [['id' => $offer->id]],
            ])
            ->assertRedirect();

        $partner = DiscountPartner::query()->firstWhere('name', 'Acme Corp');

        $this->assertNotNull($partner);
        $this->assertSame('C-2026-01', $partner->contract_no);
        $this->assertSame('Jo', $partner->contact['person']);
        $this->assertTrue($partner->offers->contains($offer));
    }

    public function test_a_contract_cannot_end_before_it_starts(): void
    {
        $this->actingAs($this->permittedUser())
            ->post(route('discount-partners.store'), [
                'name' => 'Acme Corp',
                'starts_at' => '2026-12-31',
                'ends_at' => '2026-01-01',
            ])
            ->assertSessionHasErrors('ends_at');
    }

    public function test_updating_a_partner_replaces_its_offers(): void
    {
        $partner = DiscountPartner::create(['name' => 'Acme Corp']);
        $partner->offers()->attach($this->offer()->id);
        $replacement = $this->offer('Staff 10%');

        $this->actingAs($this->permittedUser())
            ->put(route('discount-partners.update', $partner->id), [
                'name' => 'Acme Corporation',
                'active' => true,
                'offers' => [['id' => $replacement->id]],
            ])
            ->assertRedirect();

        $partner->refresh()->load('offers');

        $this->assertSame('Acme Corporation', $partner->name);
        $this->assertSame([$replacement->id], $partner->offers->pluck('id')->all());
    }

    public function test_a_partner_is_soft_deleted(): void
    {
        $partner = DiscountPartner::create(['name' => 'Acme Corp']);

        $this->actingAs($this->permittedUser())
            ->delete(route('discount-partners.destroy', $partner->id))
            ->assertRedirect();

        $this->assertSoftDeleted('discount_partners', ['id' => $partner->id]);
    }

    private function offer(string $title = 'Staff 20%'): Offer
    {
        return Offer::create([
            'title' => $title,
            'description' => 'Contract discount',
            'type' => OfferType::PERCENTAGE,
            'amount' => 20,
            'active' => true,
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
