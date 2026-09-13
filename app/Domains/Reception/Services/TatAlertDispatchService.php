<?php

declare(strict_types=1);

namespace App\Domains\Reception\Services;

use App\Domains\Reception\Adapters\UserAdapter;
use App\Domains\Reception\DTOs\TatAlertDTO;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Models\TatAlertRule;
use App\Domains\Reception\Notifications\TatDeadlineApproaching;
use App\Domains\Reception\Repositories\AcceptanceItemRepository;
use App\Domains\Reception\Repositories\TatAlertRuleRepository;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Notification;

/**
 * Runs the TAT alert rules: finds open acceptance items that are running out of
 * turnaround time and reminds each rule's users and roles, one notification per acceptance.
 */
class TatAlertDispatchService
{
    public function __construct(
        private readonly TatAlertRuleRepository $ruleRepository,
        private readonly AcceptanceItemRepository $acceptanceItemRepository,
        private readonly UserAdapter $userAdapter,
        private readonly TATService $tatService,
    ) {}

    /**
     * @return int number of acceptance alerts sent
     */
    public function run(Carbon $now, bool $force = false): int
    {
        $sent = 0;
        foreach ($this->ruleRepository->getRulesDueToRun($now, $force) as $rule) {
            $sent += $this->runRule($rule, $now);
            $this->ruleRepository->markRun($rule, $now);
        }

        return $sent;
    }

    private function runRule(TatAlertRule $rule, Carbon $now): int
    {
        $testIds = $rule->tests->pluck('id')->all();
        if ($testIds === []) {
            return 0;
        }

        $recipients = $this->userAdapter->getAlertRecipients(
            $rule->users->pluck('id')->all(),
            $rule->roles->pluck('id')->all(),
        );
        if ($recipients->isEmpty()) {
            return 0;
        }

        $items = $this->acceptanceItemRepository->getOpenItemsForTests($testIds);
        $alerts = $this->buildAlerts($rule, $items, $now);
        foreach ($alerts as $alert) {
            Notification::send($recipients, new TatDeadlineApproaching($alert));
        }

        return count($alerts);
    }

    /**
     * TAT runs in working days from the moment the item was added, as on the TAT dashboard.
     *
     * @param  iterable<int, AcceptanceItem>  $items
     * @return list<TatAlertDTO>
     */
    private function buildAlerts(TatAlertRule $rule, iterable $items, Carbon $now): array
    {
        return Collection::make($items)
            ->map(function (AcceptanceItem $item) use ($now) {
                $tat = (int) ($item->method->turnaround_time ?? 0);
                $start = Carbon::parse($item->created_at);

                return [
                    'item' => $item,
                    'days_left' => $tat - $this->tatService->elapsedWorkingDays($start, $now),
                    'deadline' => $this->tatService->addWorkingDays($start, $tat),
                ];
            })
            ->filter(fn (array $row) => $row['days_left'] <= $rule->days_left)
            ->groupBy(fn (array $row) => $row['item']->acceptance_id)
            ->map(function (Collection $rows) use ($rule) {
                $acceptance = $rows->first()['item']->acceptance;
                $mostUrgent = $rows->sortBy('days_left')->first();

                return new TatAlertDTO(
                    acceptanceId: $acceptance->id,
                    referenceCode: $acceptance->referenceCode,
                    patientName: $acceptance->patient?->fullName,
                    testNames: $rows->map(fn (array $row) => $row['item']->test?->name)
                        ->filter()
                        ->unique()
                        ->values()
                        ->all(),
                    daysLeft: $mostUrgent['days_left'],
                    deadline: $mostUrgent['deadline']->toDateString(),
                    ruleName: $rule->name,
                );
            })
            ->values()
            ->all();
    }
}
