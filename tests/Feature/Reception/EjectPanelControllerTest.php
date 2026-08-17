<?php

declare(strict_types=1);

namespace Tests\Feature\Reception;

use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Laboratory\Models\Method;
use App\Domains\Laboratory\Models\MethodTest;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Models\Patient;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * HTTP-level coverage for the eject-panel endpoint: the guard that rejects a
 * non-panel item and the route scoping that keeps the item tied to the
 * acceptance being authorized. The conversion itself is covered by
 * AcceptanceItemConversionServiceTest.
 */
class EjectPanelControllerTest extends TestCase
{
    use RefreshDatabase;

    private const PERMISSION = 'Reception.Acceptances.Edit Acceptance';

    private Patient $patient;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs($this->userWithPermission());

        $this->patient = Patient::create([
            'fullName' => 'Eject Patient',
            'idNo' => 'EJC'.Str::random(6),
            'nationality' => 'OM',
            'dateOfBirth' => '1990-01-01',
            'gender' => 'male',
            'registrar_id' => auth()->id(),
        ]);
    }

    private function userWithPermission(): User
    {
        $user = User::factory()->create();
        Permission::findOrCreate(self::PERMISSION);
        $user->givePermissionTo(self::PERMISSION);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $user;
    }

    private function createAcceptance(): Acceptance
    {
        return Acceptance::create([
            'status' => AcceptanceStatus::WAITING_FOR_PAYMENT,
            'step' => 5,
            'patient_id' => $this->patient->id,
            'acceptor_id' => auth()->id(),
            'financial_approved' => false,
            'out_patient' => false,
            'waiting_for_pooling' => false,
        ]);
    }

    private function createTest(TestType $type = TestType::TEST, float $price = 0): Test
    {
        return Test::create([
            'name' => 'Test '.Str::random(4),
            'fullName' => 'Full Test',
            'code' => 'T'.uniqid(),
            'type' => $type,
            'status' => true,
            'can_merge' => false,
            'price' => $price,
        ]);
    }

    private function createMethod(): Method
    {
        return Method::create([
            'name' => 'Method '.Str::random(4),
            'price' => 0,
            'turnaround_time' => 1,
            'status' => true,
            'no_patient' => 1,
            'no_sample' => 1,
        ]);
    }

    private function createMethodTest(Method $method, Test $test, bool $isDefault): MethodTest
    {
        return MethodTest::create([
            'method_id' => $method->id,
            'test_id' => $test->id,
            'is_default' => $isDefault,
            'status' => true,
        ]);
    }

    private function createItem(Acceptance $acceptance, MethodTest $methodTest, ?string $panelId = null): AcceptanceItem
    {
        return AcceptanceItem::create([
            'acceptance_id' => $acceptance->id,
            'method_test_id' => $methodTest->id,
            'panel_id' => $panelId,
            'price' => 10,
            'discount' => 0,
            'reportless' => false,
            'sampleless' => false,
            'no_sample' => 1,
            'customParameters' => [],
            'timeline' => [],
        ]);
    }

    /**
     * A panel item plus the individual (default) MethodTest it ejects back onto.
     *
     * @return array{0: AcceptanceItem, 1: MethodTest}
     */
    private function createPanelItem(Acceptance $acceptance): array
    {
        $panelTest = $this->createTest(TestType::PANEL, price: 30);
        $method = $this->createMethod();
        $panelMt = $this->createMethodTest($method, $panelTest, isDefault: false);

        $individualTest = $this->createTest(price: 10);
        $defaultMt = $this->createMethodTest($method, $individualTest, isDefault: true);

        $item = $this->createItem($acceptance, $panelMt, panelId: (string) Str::uuid());

        return [$item, $defaultMt];
    }

    public function test_ejects_a_panel_item_back_to_its_individual_method_test(): void
    {
        $acceptance = $this->createAcceptance();
        [$item, $defaultMt] = $this->createPanelItem($acceptance);

        $this->put(route('acceptanceItems.ejectPanel', [
            'acceptance' => $acceptance->id,
            'acceptanceItem' => $item->id,
        ]))->assertRedirect()->assertSessionHasNoErrors();

        $item->refresh();
        $this->assertSame($defaultMt->id, $item->method_test_id);
        $this->assertNull($item->panel_id);
    }

    // The controller answers with a validation error rather than a hard failure,
    // so the page has something to render — it used to be dropped silently.
    public function test_rejects_an_item_that_is_not_part_of_a_panel(): void
    {
        $acceptance = $this->createAcceptance();
        $method = $this->createMethod();
        $individualTest = $this->createTest(price: 10);
        $individualMt = $this->createMethodTest($method, $individualTest, isDefault: true);
        $item = $this->createItem($acceptance, $individualMt);

        $this->put(route('acceptanceItems.ejectPanel', [
            'acceptance' => $acceptance->id,
            'acceptanceItem' => $item->id,
        ]))->assertRedirect()->assertSessionHasErrors('message');

        $item->refresh();
        $this->assertSame($individualMt->id, $item->method_test_id);
    }

    public function test_does_not_eject_an_item_belonging_to_another_acceptance(): void
    {
        $acceptance = $this->createAcceptance();
        $otherAcceptance = $this->createAcceptance();
        [$foreignItem, $defaultMt] = $this->createPanelItem($otherAcceptance);

        // Route bindings are scoped, so the item is unreachable through an
        // acceptance that does not own it even though that acceptance is editable.
        $this->put(route('acceptanceItems.ejectPanel', [
            'acceptance' => $acceptance->id,
            'acceptanceItem' => $foreignItem->id,
        ]))->assertNotFound();

        $foreignItem->refresh();
        $this->assertNotSame($defaultMt->id, $foreignItem->method_test_id);
        $this->assertNotNull($foreignItem->panel_id);
    }
}
