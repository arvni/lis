<?php

declare(strict_types=1);

namespace App\Domains\Billing\Services;

use App\Domains\Billing\Enums\DiscountCardStatus;
use App\Domains\Billing\Models\DiscountCard;
use App\Domains\Billing\Models\DiscountCardBatch;
use App\Domains\Billing\Repositories\DiscountCardBatchRepository;
use App\Domains\Billing\Repositories\DiscountCardRepository;
use App\Domains\Billing\Support\CardQrSigner;
use DNS2D;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class DiscountCardService
{
    /**
     * Rendering QR images is CPU-bound, so a print run is served in sheets rather
     * than dumping a whole 10k-card batch into one response.
     */
    public const PRINT_CHUNK = 500;

    public function __construct(
        private readonly DiscountCardRepository $cardRepository,
        private readonly DiscountCardBatchRepository $batchRepository,
        private readonly CardQrSigner $signer,
    ) {}

    public function listCards(array $queryData): LengthAwarePaginator
    {
        return $this->cardRepository->listCards($queryData);
    }

    /**
     * Status changes are the whole control surface for a bearer card: activating it
     * on handover, suspending a suspicious one, killing a leaked one for good.
     */
    public function changeStatus(DiscountCard $card, DiscountCardStatus $status): DiscountCard
    {
        $data = ['status' => $status];

        if ($status === DiscountCardStatus::ACTIVE && $card->activated_at === null) {
            $data['activated_at'] = now();
        }

        return $this->cardRepository->updateCard($card, $data);
    }

    public function revoke(DiscountCard $card): DiscountCard
    {
        return $this->changeStatus($card, DiscountCardStatus::REVOKED);
    }

    public function updateCard(DiscountCard $card, array $data): DiscountCard
    {
        return $this->cardRepository->updateCard($card, $data);
    }

    /**
     * One sheet of cards ready to print: each with the signed QR it will be scanned by.
     *
     * @return Collection<int, array<string, mixed>>
     */
    public function buildPrintSheet(DiscountCardBatch $batch, int $from, int $to): Collection
    {
        $cards = $batch->cards()
            ->whereBetween('serial', [$from, $to])
            ->orderBy('serial')
            ->limit(self::PRINT_CHUNK)
            ->get();

        $this->batchRepository->markPrinted($batch);

        return $cards->map($this->printRow(...));
    }

    /**
     * @return array<string, mixed>
     */
    private function printRow(DiscountCard $card): array
    {
        return [
            'id' => $card->id,
            'number' => $card->number,
            'series' => $card->series,
            'serial' => $card->serial,
            'expires_at' => $card->expires_at?->format('Y-m-d'),
            'qr' => $this->qrDataUri($this->signer->urlFor($card)),
        ];
    }

    private function qrDataUri(string $payload): string
    {
        return 'data:image/png;base64,'.DNS2D::getBarcodePNG($payload, 'QRCODE,H', 4, 4, [0, 0, 0]);
    }
}
