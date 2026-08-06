<?php

declare(strict_types=1);

namespace App\Domains\Reception\Services;

use App\Domains\Laboratory\Enums\TestType;
use App\Domains\Reception\Adapters\ReferrerAdapter;
use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Notifications\PatientReportPublished;
use App\Domains\Reception\Repositories\AcceptanceRepository;
use Illuminate\Support\Facades\Notification;

/**
 * The acceptance status state machine. Owns every rule that decides whether an
 * acceptance is POOLING / PROCESSING / WAITING_FOR_PUBLISHING / REPORTED and the
 * published-report notifications that ride on the REPORTED transition. Extracted
 * from AcceptanceService (improvement-plan #26) so that service can stay focused
 * on the acceptance lifecycle (create/update/delete) and delegate status
 * decisions here. Behavior is unchanged — AcceptanceService forwards to this.
 */
class AcceptanceStatusService
{
    public function __construct(
        private readonly AcceptanceRepository $acceptanceRepository,
        private readonly ReferrerAdapter $referrerAdapter,
    ) {}

    public function updateAcceptanceStatus(Acceptance $acceptance, AcceptanceStatus $status): void
    {
        $this->acceptanceRepository->updateAcceptance($acceptance, ['status' => $status]);

        // Mirror the acceptance status onto every linked referrer order so the
        // provider stays in sync on any status change. The webhook payload
        // collapses the acceptance status to processing/reported, so we map to
        // the same two values here. updateReferrerOrderStatus only dispatches a
        // webhook when the order's status actually changes.
        $referrerOrderStatus = $status === AcceptanceStatus::REPORTED ? 'reported' : 'processing';
        $acceptance->load('referrerOrders');
        foreach ($acceptance->referrerOrders as $referrerOrder) {
            $this->referrerAdapter->updateOrderStatus($referrerOrder, $referrerOrderStatus);
        }
    }

    /**
     * Set the acceptance status only when it actually differs, so we avoid
     * redundant updates and referrer-order webhook dispatches.
     */
    private function setStatusIfChanged(Acceptance $acceptance, AcceptanceStatus $status): void
    {
        if ($acceptance->status !== $status) {
            $this->updateAcceptanceStatus($acceptance, $status);
        }
    }

    /**
     * Pooling takes priority: while the acceptance is flagged as waiting for
     * pooling, its status must be POOLING regardless of the rest of the
     * workflow. The flag is cleared manually once pooling is complete, after
     * which a subsequent check recomputes the real downstream status.
     *
     * @return bool True when pooling handled the status (caller should stop).
     */
    private function applyPoolingPriority(Acceptance $acceptance): bool
    {
        if (! $acceptance->waiting_for_pooling) {
            return false;
        }

        $this->setStatusIfChanged($acceptance, AcceptanceStatus::POOLING);

        return true;
    }

    /**
     * SERVICE type items never carry a sample or a report, so normalise them
     * before computing the acceptance status.
     */
    private function markServiceItemsAsReportless(Acceptance $acceptance): void
    {
        $acceptance->load(['acceptanceItems.test']);
        foreach ($acceptance->acceptanceItems as $item) {
            if ($item->test && $item->test->type === TestType::SERVICE) {
                if (! $item->reportless || ! $item->sampleless) {
                    $item->update(['reportless' => true, 'sampleless' => true]);
                }
            }
        }
    }

    /**
     * Terminal step shared by the status checks: REPORTED once finance has
     * approved, otherwise hold at WAITING_FOR_PUBLISHING.
     */
    private function finalizeReportedOrWaiting(Acceptance $acceptance): void
    {
        $this->setStatusIfChanged(
            $acceptance,
            $acceptance->financial_approved
                ? AcceptanceStatus::REPORTED
                : AcceptanceStatus::WAITING_FOR_PUBLISHING
        );
    }

    /**
     * Status for an acceptance that still has unfinished work: PROCESSING once a
     * section has actually picked an item up, otherwise WAITING_FOR_ENTERING when
     * samples are collected and merely waiting to be entered.
     *
     * The WAITING_FOR_ENTERING case matters for acceptances that came through
     * pooling: SampleCollectedListener parks them at POOLING and returns before
     * the normal collection transition, so once the pooling flag is cleared this
     * is the only thing that releases them from POOLING. Collected-but-not-started
     * is exactly the state the non-pooling flows already label WAITING_FOR_ENTERING,
     * so applying it here keeps the two paths consistent.
     */
    private function applyInProgressStatus(Acceptance $acceptance): void
    {
        if ($this->acceptanceRepository->countStartedAcceptanceItems($acceptance)) {
            $this->setStatusIfChanged($acceptance, AcceptanceStatus::PROCESSING);

            return;
        }

        if ($this->acceptanceRepository->countCollectedAcceptanceItems($acceptance)) {
            $this->setStatusIfChanged($acceptance, AcceptanceStatus::WAITING_FOR_ENTERING);
        }
    }

    public function checkAndUpdateAcceptanceStatus(Acceptance $acceptance): void
    {
        if ($this->applyPoolingPriority($acceptance)) {
            return;
        }

        $this->markServiceItemsAsReportless($acceptance);

        // Load acceptance items with reports
        $acceptance->load([
            'acceptanceItems' => function ($q) {
                $q->where('reportless', false)
                    ->with('report');
            },
        ]);

        $reportableItems = $acceptance->acceptanceItems;

        // If no reportable items, finance approval decides REPORTED vs waiting
        if ($reportableItems->isEmpty()) {
            $this->finalizeReportedOrWaiting($acceptance);

            return;
        }

        // Check if all reportable items have reports
        $allHaveReports = $reportableItems->every(function ($item) {
            return $item->report !== null;
        });
        if (! $allHaveReports) {
            // Not all items have reports yet — settle on PROCESSING or
            // WAITING_FOR_ENTERING. (Pooling is handled by the early return above.)
            $this->applyInProgressStatus($acceptance);

            return;
        }

        // Check if all reports are approved
        $allApproved = $reportableItems->every(function ($item) {
            return $item->report && $item->report->approved_at !== null;
        });
        if (! $allApproved) {
            return;
        }

        // Check if all are published
        $allPublished = $reportableItems->every(function ($item) {
            return $item->report && $item->report->published_at !== null;
        });

        if ($allPublished) {
            // All published, finance approval decides REPORTED vs waiting
            $this->finalizeReportedOrWaiting($acceptance);
        } else {
            // All approved but not all published
            $this->setStatusIfChanged($acceptance, AcceptanceStatus::WAITING_FOR_PUBLISHING);
        }
    }

    public function checkAcceptanceReport(Acceptance $acceptance, bool $silent = false): void
    {
        // Check if all tests are published and financial is approved
        if ($this->areAllTestsPublished($acceptance)) {
            if ($acceptance->financial_approved) {
                $this->updateAcceptanceStatus($acceptance, AcceptanceStatus::REPORTED);
                // Referrer acceptances are delivered through the provider panel:
                // sync the acceptance onto its referrer orders and push them out.
                $this->referrerAdapter->syncReportedAcceptance($acceptance);
                // Send notifications
                $this->sendPublishedNotifications($acceptance, $silent);
            } else {
                // Stay at WAITING_FOR_PUBLISHING until financial is approved
                if ($acceptance->status !== AcceptanceStatus::WAITING_FOR_PUBLISHING) {
                    $this->updateAcceptanceStatus($acceptance, AcceptanceStatus::WAITING_FOR_PUBLISHING);
                }
            }
        }
    }

    /**
     * Check if all tests for this acceptance are published
     */
    private function areAllTestsPublished(Acceptance $acceptance): bool
    {
        $publishedTestsCount = $this->countPublishedTests($acceptance);
        $reportableTestsCount = $this->countReportableTests($acceptance);

        return $publishedTestsCount == $reportableTestsCount;
    }

    /**
     * Count published tests for an acceptance
     */
    private function countPublishedTests(Acceptance $acceptance): int
    {
        return $this->acceptanceRepository->countPublishedTests($acceptance);
    }

    /**
     * Count reportable tests for an acceptance
     */
    private function countReportableTests(Acceptance $acceptance): int
    {
        return $this->acceptanceRepository->countReportableTests($acceptance);
    }

    /**
     * Send notifications about published report.
     *
     * Referrers are not notified here: a referrer acceptance is delivered by
     * syncing its referrer orders to the provider panel (see
     * ReferrerAdapter::syncReportedAcceptance), so no report email is sent.
     */
    private function sendPublishedNotifications(Acceptance $acceptance, bool $silent = false): void
    {
        $acceptance->load([
            'patient',
            'acceptanceItems' => fn ($q) => $q->where('reportless', false)
                ->with('report.publishedDocument', 'report.clinicalCommentDocument', 'test'),
        ]);
        $patient = $acceptance->patient;
        if (count($acceptance->acceptanceItems)) {
            // Send notification to patient (SMS always; WhatsApp text notification if checked)
            if (! $silent) {
                Notification::send($patient, new PatientReportPublished($acceptance));
            }
        }
    }

    public function checkAcceptanceStatus(Acceptance $acceptance): void
    {
        if ($acceptance->status == AcceptanceStatus::REPORTED) {
            return;
        }

        if ($this->applyPoolingPriority($acceptance)) {
            return;
        }

        $this->markServiceItemsAsReportless($acceptance);

        $reportableTest = $this->acceptanceRepository->countReportableTests($acceptance);

        // No reportable tests, finance approval decides REPORTED vs waiting
        if (! $reportableTest) {
            $this->finalizeReportedOrWaiting($acceptance);

            return;
        }

        // All tests published, finance approval decides REPORTED vs waiting
        $publishedTest = $this->acceptanceRepository->countPublishedTests($acceptance);
        if ($publishedTest == $reportableTest) {
            $this->finalizeReportedOrWaiting($acceptance);

            return;
        }

        // Some tests still in progress; settle on PROCESSING or
        // WAITING_FOR_ENTERING. (Pooling is handled by the early return above.)
        $this->applyInProgressStatus($acceptance);
    }
}
