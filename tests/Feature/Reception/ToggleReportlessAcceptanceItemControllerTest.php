<?php

declare(strict_types=1);

namespace Tests\Feature\Reception;

use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Laboratory\Models\Method;
use App\Domains\Laboratory\Models\MethodTest;
use App\Domains\Laboratory\Models\Section;
use App\Domains\Laboratory\Models\SectionGroup;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Reception\Enums\AcceptanceItemStateStatus;
use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Models\AcceptanceItemState;
use App\Domains\Reception\Models\Patient;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * Making an item reportless can leave its acceptance with nothing to report, so it
 * is refused while the lab is still working on the item (acceptance 2827).
 */
class ToggleReportlessAcceptanceItemControllerTest extends TestCase
{
    use RefreshDatabase;

    private const PERMISSION = 'Reception.Acceptances.Toggle Reportless Acceptance Item';

    private Patient $patient;

    private int $methodTestId;

    protected function setUp(): void
    {
        parent::setUp();
        $user = User::factory()->create(['name' => 'Reception Huda']);
        Permission::findOrCreate(self::PERMISSION);
        $user->givePermissionTo(self::PERMISSION);
        app(PermissionRegistrar::class)->forgetCachedPermissions();
        $this->actingAs($user);

        $this->patient = Patient::create([
            'fullName' => 'Toggle Patient',
            'idNo' => 'TGL'.Str::random(6),
            'nationality' => 'OM',
            'dateOfBirth' => '1990-01-01',
            'gender' => 'female',
            'registrar_id' => auth()->id(),
        ]);
        $test = Test::create(['name' => 'PGTA 24', 'fullName' => 'PGTA 24', 'code' => 'T'.uniqid(), 'type' => TestType::TEST, 'status' => true, 'can_merge' => false]);
        $method = Method::create(['name' => 'Frozen', 'price' => 0, 'turnaround_time' => 1, 'status' => true, 'no_patient' => 1, 'no_sample' => 1]);
        $this->methodTestId = (int) MethodTest::create(['method_id' => $method->id, 'test_id' => $test->id, 'is_default' => true, 'status' => true])->id;
    }

    public function test_an_item_not_yet_in_the_lab_is_toggled_and_the_change_is_on_its_timeline(): void
    {
        [$acceptance, $item] = $this->acceptanceWithItem();

        $this->put(route('acceptanceItems.toggleReportless', [$acceptance, $item]))->assertSessionHasNoErrors();

        $item->refresh();
        $this->assertTrue($item->reportless);
        $this->assertContains('Marked reportless by Reception Huda', array_values($item->timeline));

        $this->put(route('acceptanceItems.toggleReportless', [$acceptance, $item]))->assertSessionHasNoErrors();
        $this->assertFalse($item->fresh()->reportless);
    }

    public function test_an_item_still_in_the_lab_cannot_be_made_reportless_but_can_be_made_reportable(): void
    {
        [$acceptance, $item] = $this->acceptanceWithItem();
        $this->stateFor($item, AcceptanceItemStateStatus::PROCESSING);

        $this->put(route('acceptanceItems.toggleReportless', [$acceptance, $item]))->assertSessionHasErrors('message');
        $this->assertFalse($item->fresh()->reportless);

        // An item wrongly made reportless earlier can always be put back.
        $item->update(['reportless' => true]);
        $this->put(route('acceptanceItems.toggleReportless', [$acceptance, $item]))->assertSessionHasNoErrors();
        $this->assertFalse($item->fresh()->reportless);
    }

    public function test_an_item_whose_lab_work_is_finished_can_be_made_reportless(): void
    {
        [$acceptance, $item] = $this->acceptanceWithItem();
        $this->stateFor($item, AcceptanceItemStateStatus::FINISHED);

        $this->put(route('acceptanceItems.toggleReportless', [$acceptance, $item]))->assertSessionHasNoErrors();

        $this->assertTrue($item->fresh()->reportless);
    }

    public function test_an_item_of_another_acceptance_is_not_found(): void
    {
        [$acceptance] = $this->acceptanceWithItem();
        [, $other] = $this->acceptanceWithItem();

        $this->put(route('acceptanceItems.toggleReportless', [$acceptance, $other]))->assertNotFound();

        $this->assertFalse($other->fresh()->reportless);
    }

    public function test_the_permission_is_required(): void
    {
        [$acceptance, $item] = $this->acceptanceWithItem();
        $this->actingAs(User::factory()->create());

        $this->put(route('acceptanceItems.toggleReportless', [$acceptance, $item]))->assertForbidden();
    }

    /** @return array{0: Acceptance, 1: AcceptanceItem} */
    private function acceptanceWithItem(): array
    {
        $acceptance = Acceptance::create([
            'status' => AcceptanceStatus::PROCESSING,
            'step' => 5,
            'patient_id' => $this->patient->id,
            'acceptor_id' => auth()->id(),
            'financial_approved' => false,
            'out_patient' => false,
            'waiting_for_pooling' => false,
        ]);
        $item = AcceptanceItem::create([
            'acceptance_id' => $acceptance->id,
            'method_test_id' => $this->methodTestId,
            'price' => 270,
            'discount' => 0,
            'reportless' => false,
            'sampleless' => false,
            'no_sample' => 1,
            'customParameters' => [],
            'timeline' => [],
        ]);

        return [$acceptance, $item];
    }

    private function stateFor(AcceptanceItem $item, AcceptanceItemStateStatus $status): void
    {
        $section = Section::create(['name' => 'Section '.Str::random(4), 'section_group_id' => SectionGroup::create(['name' => 'Group '.Str::random(4)])->id]);
        AcceptanceItemState::create([
            'acceptance_item_id' => $item->id,
            'section_id' => $section->id,
            'user_id' => auth()->id(),
            'parameters' => [],
            'status' => $status,
        ]);
    }
}
