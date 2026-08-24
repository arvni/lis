<?php

declare(strict_types=1);

namespace App\Domains\Reception\Services;

use App\Domains\Reception\Adapters\BillingAdapter;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Repositories\AcceptanceRepository;

/**
 * Puts a partner discount card on an acceptance, and takes it off again.
 *
 * The card is stored on the acceptance; what it is worth is decided entirely by
 * Billing, so nothing here ever touches an amount.
 */
class AcceptanceDiscountCardService
{
    public function __construct(
        private readonly AcceptanceRepository $acceptanceRepository,
        private readonly BillingAdapter $billingAdapter,
    ) {}

    /**
     * @return array{valid: bool, reason: string|null, card: array<string, mixed>|null}
     */
    public function preview(string $code, ?string $signature = null): array
    {
        return $this->billingAdapter->resolveDiscountCard($code, $signature);
    }

    /**
     * Attach a card by its scanned code. An unusable card is reported back rather
     * than attached, so a rejected card never silently changes a price.
     *
     * @return array{valid: bool, reason: string|null, card: array<string, mixed>|null}
     */
    public function attach(Acceptance $acceptance, string $code, ?string $signature = null): array
    {
        $verdict = $this->billingAdapter->resolveDiscountCard($code, $signature);

        if (! $verdict['valid'] || ! $verdict['card']) {
            return $verdict;
        }

        $this->acceptanceRepository->updateAcceptance($acceptance, [
            'discount_card_id' => $verdict['card']['id'],
        ]);

        $this->billingAdapter->syncCardDiscounts($acceptance->refresh(), auth()->id());

        return $verdict;
    }

    /**
     * Remove the card and, through the same sync, its discounts — which restores
     * whatever manual discounts the card had been overriding.
     */
    public function detach(Acceptance $acceptance): void
    {
        $this->acceptanceRepository->updateAcceptance($acceptance, ['discount_card_id' => null]);

        $this->billingAdapter->syncCardDiscounts($acceptance->refresh(), auth()->id());
    }
}
