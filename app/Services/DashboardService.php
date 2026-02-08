<?php

namespace App\Services;

use App\Domains\Dashboard\DashboardData;
use App\Domains\Dashboard\DashboardItem;
use App\Domains\Reception\Repositories\AcceptanceRepository;
use App\Domains\Reception\Repositories\AcceptanceItemRepository;
use App\Domains\Billing\Repositories\PaymentRepository;
use App\Domains\Consultation\Repositories\ConsultationRepository;
use App\Domains\Reception\Repositories\ReportRepository;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

/**
 * Service that aggregates data from multiple domains to create dashboard data
 */
readonly class DashboardService
{

    /**
     * @param AcceptanceRepository $acceptanceRepository
     * @param AcceptanceItemRepository $acceptanceItemRepository
     * @param PaymentRepository $paymentRepository
     * @param ConsultationRepository $consultationRepository
     * @param ReportRepository $reportRepository
     */
    public function __construct(
        private AcceptanceRepository     $acceptanceRepository,
        private AcceptanceItemRepository $acceptanceItemRepository,
        private PaymentRepository        $paymentRepository,
        private ConsultationRepository   $consultationRepository,
        private ReportRepository        $reportRepository,
    )
    {
    }

    public function getDashboardData(Carbon $date): DashboardData
    {
        $user = Auth::user();
        $dashboardData = new DashboardData();
        $dateRange = [$date->copy()->startOfDay(), $date->copy()->endOfDay()];
        // Reception domain metrics
        if ($user->can("Dashboard.Total Acceptances")) {
            $dashboardData->addItem(new DashboardItem(
                'Today',
                'Total Acceptances',
                $this->acceptanceRepository->getTotalAcceptancesForDateRange($dateRange)
            ));
        }

        if ($user->can("Dashboard.Total Waiting Sampling")) {
            $dashboardData->addItem(new DashboardItem(
                'Waiting',
                'Waiting For Sampling',
                $this->acceptanceRepository->getTotalWaitingForSampling()
            ));
        }

        // Consultation domain metrics
        if ($user->can("Dashboard.Total Consultation")) {
            $dashboardData->addItem(new DashboardItem(
                'Today',
                'Total Consultation',
                $this->consultationRepository->getTotalConsultationForDateRange($dateRange)
            ));
        }

        if ($user->can("Dashboard.Total Waiting Consultation")) {
            $dashboardData->addItem(new DashboardItem(
                'Waiting',
                'Waiting For Consultation',
                $this->consultationRepository->getTotalWaitingForConsultation()
            ));
        }

        if ($user->can("Dashboard.Total Tests")) {
            $dashboardData->addItem(new DashboardItem(
                'Today',
                'Total Tests',
                $this->acceptanceItemRepository->getTotalTestsForDateRange($dateRange)
            ));
        }

        // Billing domain metrics
        if ($user->can("Dashboard.Total Payments")) {
            $dashboardData->addItem(new DashboardItem(
                'Today',
                'Total Payments',
                'OMR ' . $this->paymentRepository->getTotalPaymentsForDateRange($dateRange)
            ));

            $dashboardData->addItem(new DashboardItem(
                'Today',
                'Total Cash Payments',
                'OMR ' . $this->paymentRepository->getTotalCashPaymentsForDateRange($dateRange)
            ));

            $dashboardData->addItem(new DashboardItem(
                'Today',
                'Total Card Payments',
                'OMR ' . $this->paymentRepository->getTotalCardPaymentsForDateRange($dateRange)
            ));

            $dashboardData->addItem(new DashboardItem(
                'Today',
                'Total Transfer Payments',
                'OMR ' . $this->paymentRepository->getTotalTransferPaymentsForDateRange($dateRange)
            ));
        }

        // Reporting domain metrics
        if ($user->can("Dashboard.Total Reports Waiting For Approving")) {
            $dashboardData->addItem(new DashboardItem(
                'Waiting',
                'Reports Waiting For Approving',
                $this->reportRepository->getTotalReportsWaitingForApproving()
            ));
        }

        return $dashboardData;
    }
}
