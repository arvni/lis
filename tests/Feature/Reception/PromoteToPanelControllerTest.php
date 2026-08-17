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
 * HTTP-level coverage for the promote-to-panel endpoint: the request validation
 * around the payload the dialog submits. The conversion itself is covered by
 * AcceptanceItemConversionServiceTest.
 */
class PromoteToPanelControllerTest extends TestCase
{
    use RefreshDatabase;

    private const PERMISSION = 'Reception.Acceptances.Edit Acceptance';

    private Patient $patient;

    protected function setUp(): void
    {
        parent::setUp();
        // The service stamps the new items' timeline with auth()->user()->name.
        $this->actingAs($this->userWithPermission());

        $this->patient = Patient::create([
            'fullName' => 'Promote Patient',
            'idNo' => 'PRM'.Str::random(6),
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

    private function createItem(Acceptance $acceptance, MethodTest $methodTest): AcceptanceItem
    {
        return AcceptanceItem::create([
            'acceptance_id' => $acceptance->id,
            'method_test_id' => $methodTest->id,
            'price' => 10,
            'discount' => 0,
            'reportless' => false,
            'sampleless' => false,
            'no_sample' => 1,
            'customParameters' => [],
            'timeline' => [],
        ]);
    }

    public function test_promotes_selected_items_onto_the_panel(): void
    {
        $panel = $this->createTest(TestType::PANEL, price: 60);
        $methodA = $this->createMethod();
        $methodB = $this->createMethod();
        $panelMtA = $this->createMethodTest($methodA, $panel, isDefault: false);
        $panelMtB = $this->createMethodTest($methodB, $panel, isDefault: false);

        $individualTest = $this->createTest(price: 10);
        $individualMt = $this->createMethodTest($methodA, $individualTest, isDefault: true);

        $acceptance = $this->createAcceptance();
        $item = $this->createItem($acceptance, $individualMt);

        $this->put(route('acceptances.promoteToPanel', $acceptance->id), [
            'acceptance_item_ids' => [$item->id],
            'panel_method_tests' => [$panelMtA->id, $panelMtB->id],
        ])->assertRedirect()->assertSessionHasNoErrors();

        $item->refresh();
        $this->assertSame($panelMtA->id, $item->method_test_id);
        $this->assertNotNull($item->panel_id);

        // The uncovered panel method test got its own item under the same panel.
        $this->assertDatabaseHas('acceptance_items', [
            'acceptance_id' => $acceptance->id,
            'method_test_id' => $panelMtB->id,
            'panel_id' => $item->panel_id,
        ]);
    }

    public function test_accepts_a_panel_made_of_a_single_method_test(): void
    {
        // Tests are stored with `method_tests` min:1, so a one-component panel is
        // valid data and must not be rejected by the promote payload rules.
        $panel = $this->createTest(TestType::PANEL, price: 30);
        $method = $this->createMethod();
        $panelMt = $this->createMethodTest($method, $panel, isDefault: false);

        $individualTest = $this->createTest(price: 10);
        $individualMt = $this->createMethodTest($method, $individualTest, isDefault: true);

        $acceptance = $this->createAcceptance();
        $item = $this->createItem($acceptance, $individualMt);

        $this->put(route('acceptances.promoteToPanel', $acceptance->id), [
            'acceptance_item_ids' => [$item->id],
            'panel_method_tests' => [$panelMt->id],
        ])->assertRedirect()->assertSessionHasNoErrors();

        $item->refresh();
        $this->assertSame($panelMt->id, $item->method_test_id);
        $this->assertNotNull($item->panel_id);
    }

    public function test_rejects_items_belonging_to_another_acceptance(): void
    {
        $panel = $this->createTest(TestType::PANEL, price: 30);
        $method = $this->createMethod();
        $panelMt = $this->createMethodTest($method, $panel, isDefault: false);

        $individualTest = $this->createTest(price: 10);
        $individualMt = $this->createMethodTest($method, $individualTest, isDefault: true);

        $acceptance = $this->createAcceptance();
        $foreignItem = $this->createItem($this->createAcceptance(), $individualMt);

        $this->put(route('acceptances.promoteToPanel', $acceptance->id), [
            'acceptance_item_ids' => [$foreignItem->id],
            'panel_method_tests' => [$panelMt->id],
        ])->assertSessionHasErrors('acceptance_item_ids.0');

        $foreignItem->refresh();
        $this->assertSame($individualMt->id, $foreignItem->method_test_id);
        $this->assertNull($foreignItem->panel_id);
    }

    public function test_rejects_an_empty_panel_composition(): void
    {
        $method = $this->createMethod();
        $individualTest = $this->createTest(price: 10);
        $individualMt = $this->createMethodTest($method, $individualTest, isDefault: true);

        $acceptance = $this->createAcceptance();
        $item = $this->createItem($acceptance, $individualMt);

        $this->put(route('acceptances.promoteToPanel', $acceptance->id), [
            'acceptance_item_ids' => [$item->id],
            'panel_method_tests' => [],
        ])->assertSessionHasErrors('panel_method_tests');

        $item->refresh();
        $this->assertNull($item->panel_id);
    }
}
