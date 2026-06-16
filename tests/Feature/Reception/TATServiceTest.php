<?php

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
use App\Domains\Reception\Models\Report;
use App\Domains\Reception\Services\TATService;
use App\Domains\User\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TATServiceTest extends TestCase
{
    use RefreshDatabase;

    private TATService $service;
    private Section $section;
    private Patient $patient;

    protected function setUp(): void
    {
        parent::setUp();
        $this->actingAs(User::factory()->create());
        $this->service = new TATService();

        $group = SectionGroup::create(['name' => 'TAT Group']);
        $this->section = Section::create(['name' => 'TAT Section', 'section_group_id' => $group->id]);

        $this->patient = Patient::create([
            'fullName'     => 'TAT Patient',
            'idNo'         => 'TAT001',
            'nationality'  => 'OM',
            'dateOfBirth'  => '1990-01-01',
            'gender'       => 'male',
            'registrar_id' => auth()->id(),
        ]);
    }

    // ── Pure working-day helpers ───────────────────────────────────────────────

    public function test_add_working_days_skips_friday_and_saturday(): void
    {
        // 2026-06-18 is a Thursday; +1 working day must skip Fri/Sat → Sunday 21st.
        $result = $this->service->addWorkingDays(Carbon::parse('2026-06-18'), 1);
        $this->assertSame('2026-06-21', $result->toDateString());
        $this->assertSame(Carbon::SUNDAY, $result->dayOfWeek);
    }

    public function test_add_working_days_spans_multiple_weeks(): void
    {
        // Monday 2026-06-15 + 5 working days → Monday 2026-06-22.
        $result = $this->service->addWorkingDays(Carbon::parse('2026-06-15'), 5);
        $this->assertSame('2026-06-22', $result->toDateString());
    }

    public function test_add_working_days_with_zero_returns_same_date(): void
    {
        $start = Carbon::parse('2026-06-15');
        $result = $this->service->addWorkingDays($start, 0);
        $this->assertSame($start->toDateString(), $result->toDateString());
        // Must not mutate the input.
        $this->assertSame('2026-06-15', $start->toDateString());
    }

    public function test_elapsed_working_days_excludes_weekend(): void
    {
        // Mon 2026-06-15 → Mon 2026-06-22 has 5 working days (Fri 19 + Sat 20 excluded).
        $count = $this->service->elapsedWorkingDays(
            Carbon::parse('2026-06-15'),
            Carbon::parse('2026-06-22'),
        );
        $this->assertSame(5, $count);
    }

    public function test_elapsed_working_days_same_day_is_zero(): void
    {
        $count = $this->service->elapsedWorkingDays(
            Carbon::parse('2026-06-15 09:00'),
            Carbon::parse('2026-06-15 17:00'),
        );
        $this->assertSame(0, $count);
    }

    // ── resolveAnalyticsDates ──────────────────────────────────────────────────

    public function test_resolve_analytics_dates_today_preset(): void
    {
        [$from, $to] = $this->service->resolveAnalyticsDates(['a_preset' => 'today']);
        $this->assertTrue($from->isStartOfDay());
        $this->assertSame($from->toDateString(), $to->toDateString());
        $this->assertSame(23, $to->hour);
    }

    public function test_resolve_analytics_dates_last_7_days_preset(): void
    {
        [$from, $to] = $this->service->resolveAnalyticsDates(['a_preset' => 'last_7_days']);
        $this->assertSame(7, (int) round($from->diffInDays($to)));
    }

    public function test_resolve_analytics_dates_default_uses_explicit_from_to(): void
    {
        [$from, $to] = $this->service->resolveAnalyticsDates([
            'a_from' => '2026-01-01',
            'a_to'   => '2026-01-31',
        ]);
        $this->assertSame('2026-01-01', $from->toDateString());
        $this->assertSame('2026-01-31', $to->toDateString());
        $this->assertTrue($from->isStartOfDay());
    }

    public function test_resolve_analytics_dates_default_falls_back_to_last_30_days(): void
    {
        [$from, $to] = $this->service->resolveAnalyticsDates([]);
        $this->assertSame(30, (int) round($from->diffInDays($to)));
    }

    // ── DB-backed query methods ────────────────────────────────────────────────

    public function test_get_items_count_excludes_reported_cancelled_and_pooling(): void
    {
        // Active acceptance with an unreported, non-service item → counted.
        $this->makeAcceptanceWithItem(AcceptanceStatus::PROCESSING);
        // Reported acceptance → excluded.
        $this->makeAcceptanceWithItem(AcceptanceStatus::REPORTED);
        // Cancelled acceptance → excluded.
        $this->makeAcceptanceWithItem(AcceptanceStatus::CANCELLED);
        // Waiting-for-pooling acceptance → excluded.
        $this->makeAcceptanceWithItem(AcceptanceStatus::PROCESSING, pooling: true);

        $this->assertSame(1, $this->service->getItemsCount([]));
    }

    public function test_get_items_count_excludes_service_only_acceptances(): void
    {
        // An acceptance whose only item is a SERVICE test is not a TAT subject.
        $this->makeAcceptanceWithItem(AcceptanceStatus::PROCESSING, testType: TestType::SERVICE);
        $this->assertSame(0, $this->service->getItemsCount([]));
    }

    public function test_get_items_maps_tat_fields(): void
    {
        $acceptance = $this->makeAcceptanceWithItem(
            AcceptanceStatus::PROCESSING,
            turnaround: 2,
            withState: true,
        );

        $rows = $this->service->getItems([]);
        $this->assertCount(1, $rows);

        $row = $rows->first();
        $this->assertSame($acceptance->id, $row['id']);
        $this->assertSame('TAT Patient', $row['patient_name']);
        $this->assertSame(2, $row['max_tat']);
        $this->assertSame(1, $row['active_items_count']);
        $this->assertNotNull($row['deadline']);
        $this->assertContains($this->section->name, collect($row['sections'])->pluck('name'));
    }

    public function test_get_items_flags_breached_when_past_deadline(): void
    {
        // Item created 40 days ago with a 1-day TAT is well past its deadline.
        $this->makeAcceptanceWithItem(
            AcceptanceStatus::PROCESSING,
            turnaround: 1,
            itemCreatedAt: Carbon::now()->subDays(40),
        );

        $row = $this->service->getItems([])->first();
        $this->assertTrue($row['is_breached']);
    }

    public function test_get_items_paginated_returns_data_and_meta(): void
    {
        $this->makeAcceptanceWithItem(AcceptanceStatus::PROCESSING);
        $this->makeAcceptanceWithItem(AcceptanceStatus::PROCESSING);

        $result = $this->service->getItemsPaginated([], page: 1, perPage: 1);

        $this->assertCount(1, $result['data']);
        $this->assertSame(2, $result['meta']['total']);
        $this->assertSame(1, $result['meta']['per_page']);
        $this->assertSame(1, $result['meta']['current_page']);
        $this->assertSame(2, $result['meta']['last_page']);
    }

    public function test_get_summary_aggregates_totals_and_sections(): void
    {
        $this->makeAcceptanceWithItem(AcceptanceStatus::PROCESSING, turnaround: 2, withState: true);

        $summary = $this->service->getSummary([]);

        $this->assertSame(1, $summary['total_active']);
        $this->assertArrayHasKey('breached', $summary);
        $this->assertArrayHasKey('at_risk', $summary);
        $this->assertArrayHasKey('on_time_pct', $summary);
        $this->assertCount(1, $summary['by_section']);
        $this->assertSame($this->section->name, $summary['by_section'][0]['section']);
    }

    public function test_get_test_analytics_groups_published_items_by_test(): void
    {
        // A published, non-service item created 1 working day before publication.
        $this->makeAcceptanceWithItem(
            AcceptanceStatus::REPORTED,
            turnaround: 3,
            itemCreatedAt: Carbon::parse('2026-06-15 08:00'),
            publishedAt: Carbon::parse('2026-06-16 08:00'),
        );

        $analytics = $this->service->getTestAnalytics([
            'a_from' => '2026-06-01',
            'a_to'   => '2026-06-30',
        ]);

        $this->assertCount(1, $analytics);
        $this->assertSame(1, $analytics[0]['count']);
        $this->assertSame(3, $analytics[0]['target_days']);
        $this->assertTrue($analytics[0]['on_target']);
    }

    public function test_get_test_analytics_empty_when_no_published_reports(): void
    {
        $this->makeAcceptanceWithItem(AcceptanceStatus::PROCESSING); // no report
        $this->assertSame([], $this->service->getTestAnalytics([
            'a_from' => '2026-06-01',
            'a_to'   => '2026-06-30',
        ]));
    }

    // ── Fixture helper ─────────────────────────────────────────────────────────

    private function makeAcceptanceWithItem(
        AcceptanceStatus $status,
        int $turnaround = 1,
        TestType $testType = TestType::TEST,
        bool $pooling = false,
        bool $withState = false,
        ?Carbon $itemCreatedAt = null,
        ?Carbon $publishedAt = null,
    ): Acceptance {
        $methodTestId = $this->makeMethodTest($turnaround, $testType);

        $acceptance = Acceptance::create([
            'status'              => $status,
            'step'                => 5,
            'patient_id'          => $this->patient->id,
            'acceptor_id'         => auth()->id(),
            'financial_approved'  => false,
            'out_patient'         => false,
            'waiting_for_pooling' => $pooling,
            'priority'            => 'routine',
        ]);

        $item = AcceptanceItem::create([
            'acceptance_id'    => $acceptance->id,
            'method_test_id'   => $methodTestId,
            'price'            => 50,
            'discount'         => 0,
            'reportless'       => false,
            'sampleless'       => false,
            'no_sample'        => 1,
            'customParameters' => [],
            'timeline'         => [],
        ]);

        if ($itemCreatedAt) {
            $item->forceFill(['created_at' => $itemCreatedAt])->saveQuietly();
        }

        if ($withState) {
            AcceptanceItemState::create([
                'acceptance_item_id' => $item->id,
                'section_id'         => $this->section->id,
                'user_id'            => auth()->id(),
                'parameters'         => [],
                'status'             => AcceptanceItemStateStatus::PROCESSING,
            ]);
        }

        if ($publishedAt) {
            Report::create([
                'reporter_id'        => auth()->id(),
                'acceptance_item_id' => $item->id,
                'status'             => true,
                'published_at'       => $publishedAt,
                'approved_at'        => $publishedAt,
            ]);
        }

        return $acceptance;
    }

    private function makeMethodTest(int $turnaround, TestType $testType): int
    {
        $test = Test::create([
            'name'      => 'TAT Test ' . uniqid(),
            'fullName'  => 'TAT Test Full',
            'code'      => 'TT' . uniqid(),
            'type'      => $testType,
            'status'    => true,
            'can_merge' => false,
        ]);
        $method = Method::create([
            'name'            => 'TAT Method',
            'price'           => 0,
            'turnaround_time' => $turnaround,
            'status'          => true,
            'no_patient'      => 1,
            'no_sample'       => 1,
        ]);
        return (int) MethodTest::create([
            'method_id'  => $method->id,
            'test_id'    => $test->id,
            'is_default' => true,
            'status'     => true,
        ])->id;
    }
}
