<?php

declare(strict_types=1);

namespace Tests\Unit\Referrer;

use App\Domains\Reception\Enums\AcceptanceStatus;
use App\Domains\Referrer\Enums\ReferrerOrderStatus;
use Tests\TestCase;

class ReferrerOrderStatusTest extends TestCase
{
    public function test_reported_acceptance_maps_to_reported_order(): void
    {
        $this->assertSame(
            ReferrerOrderStatus::REPORTED,
            ReferrerOrderStatus::fromAcceptanceStatus(AcceptanceStatus::REPORTED)
        );
    }

    public function test_finance_gate_is_mirrored_onto_the_order(): void
    {
        $this->assertSame(
            ReferrerOrderStatus::WAITING_FOR_FINANCIAL_APPROVAL,
            ReferrerOrderStatus::fromAcceptanceStatus(AcceptanceStatus::WAITING_FOR_FINANCIAL_APPROVAL)
        );
    }

    /**
     * Once finance approves, the acceptance moves to WAITING_FOR_PUBLISHING.
     * The order must hold at the finance status rather than stepping backwards
     * to "processing" — it only leaves once the reports are published.
     */
    public function test_waiting_for_publishing_holds_at_the_finance_status(): void
    {
        $this->assertSame(
            ReferrerOrderStatus::WAITING_FOR_FINANCIAL_APPROVAL,
            ReferrerOrderStatus::fromAcceptanceStatus(AcceptanceStatus::WAITING_FOR_PUBLISHING)
        );
    }

    /**
     * Everything else still collapses to "processing" for the provider.
     */
    public function test_in_flight_statuses_collapse_to_processing(): void
    {
        $inFlight = [
            AcceptanceStatus::PENDING,
            AcceptanceStatus::WAITING_FOR_PAYMENT,
            AcceptanceStatus::SAMPLING,
            AcceptanceStatus::POOLING,
            AcceptanceStatus::WAITING_FOR_ENTERING,
            AcceptanceStatus::PROCESSING,
            AcceptanceStatus::CANCELLED,
        ];

        foreach ($inFlight as $status) {
            $this->assertSame(
                ReferrerOrderStatus::PROCESSING,
                ReferrerOrderStatus::fromAcceptanceStatus($status),
                "{$status->value} should collapse to processing"
            );
        }
    }

    public function test_open_values_cover_every_non_terminal_status(): void
    {
        $this->assertSame(
            ['waiting', 'processing', 'waiting for financial approval'],
            ReferrerOrderStatus::openValues()
        );
    }
}
