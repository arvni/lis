<?php

declare(strict_types=1);

namespace App\Domains\Billing\Services;

use App\Domains\Billing\DTOs\IssueCardBatchDTO;
use App\Domains\Billing\Enums\DiscountCardStatus;
use App\Domains\Billing\Models\DiscountCardBatch;
use App\Domains\Billing\Repositories\DiscountCardBatchRepository;
use App\Domains\Billing\Repositories\DiscountCardRepository;
use App\Domains\Billing\Support\CardSerialGenerator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DiscountCardIssuanceService
{
    private const MAX_SERIES_ATTEMPTS = 5;

    public function __construct(
        private readonly DiscountCardBatchRepository $batchRepository,
        private readonly DiscountCardRepository $cardRepository,
        private readonly CardSerialGenerator $serialGenerator,
    ) {}

    /**
     * Create a batch and its cards in one transaction, so a failed run never leaves
     * a batch claiming cards that do not exist.
     */
    public function issue(IssueCardBatchDTO $dto, ?int $issuedBy): DiscountCardBatch
    {
        return DB::transaction(function () use ($dto, $issuedBy): DiscountCardBatch {
            $series = $this->uniqueSeries($dto->prefix);

            $batch = $this->batchRepository->createBatch([
                'discount_partner_id' => $dto->discount_partner_id,
                'series' => $series,
                'prefix' => $dto->prefix,
                'quantity' => $dto->quantity,
                'expires_at' => $dto->expires_at,
                'usage_limit' => $dto->usage_limit,
                'issued_by' => $issuedBy,
                'notes' => $dto->notes,
            ]);

            $this->cardRepository->insertMany($this->buildCardRows($batch, $dto));

            return $batch;
        });
    }

    /**
     * Rows are inserted directly rather than through the model, so every value here
     * must already be in its stored form (enum value, formatted dates).
     *
     * @return list<array<string, mixed>>
     */
    private function buildCardRows(DiscountCardBatch $batch, IssueCardBatchDTO $dto): array
    {
        $now = now();
        $status = $dto->activate_immediately
            ? DiscountCardStatus::ACTIVE
            : DiscountCardStatus::INACTIVE;

        $rows = [];
        for ($serial = 1; $serial <= $dto->quantity; $serial++) {
            $rows[] = [
                'uuid' => Str::uuid()->toString(),
                'discount_card_batch_id' => $batch->id,
                'discount_partner_id' => $batch->discount_partner_id,
                'series' => $batch->series,
                'serial' => $serial,
                'number' => $this->serialGenerator->numberFor($batch->series, $serial),
                'status' => $status->value,
                'issued_at' => $now,
                'activated_at' => $dto->activate_immediately ? $now : null,
                'expires_at' => $dto->expires_at,
                'usage_limit' => $dto->usage_limit,
                'used_count' => 0,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        return $rows;
    }

    private function uniqueSeries(?string $prefix): string
    {
        for ($attempt = 0; $attempt < self::MAX_SERIES_ATTEMPTS; $attempt++) {
            $series = $this->serialGenerator->generateSeries($prefix);
            if (! $this->batchRepository->seriesExists($series)) {
                return $series;
            }
        }

        // Astronomically unlikely; fall back to something that cannot collide.
        return $this->serialGenerator->generateSeries($prefix).'-'.Str::upper(Str::random(6));
    }
}
