<?php

declare(strict_types=1);

namespace App\Domains\Billing\Services;

use App\Domains\Billing\DTOs\IssueCardBatchDTO;
use App\Domains\Billing\Enums\DiscountCardStatus;
use App\Domains\Billing\Exceptions\InvalidCardNumberTemplateException;
use App\Domains\Billing\Models\DiscountCardBatch;
use App\Domains\Billing\Repositories\DiscountCardBatchRepository;
use App\Domains\Billing\Repositories\DiscountCardRepository;
use App\Domains\Billing\Support\CardNumberTemplate;
use App\Domains\Billing\Support\CardSerialGenerator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DiscountCardIssuanceService
{
    private const MAX_SERIES_ATTEMPTS = 5;

    /**
     * Headroom a template must have over the batch size. Filling a template to the
     * brim turns the last few cards into a long retry loop, and leaves the space so
     * dense that a guessed number is likely to hit a real card.
     */
    private const CAPACITY_HEADROOM = 10;

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
                'number_template' => $dto->number_template,
                'quantity' => $dto->quantity,
                'serial_from' => $dto->serial_from,
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

        $numbers = $this->mintNumbers($batch, $dto);
        $rows = [];
        $serial = $dto->serial_from;

        foreach ($numbers as $number) {
            $rows[] = [
                'uuid' => Str::uuid()->toString(),
                'discount_card_batch_id' => $batch->id,
                'discount_partner_id' => $batch->discount_partner_id,
                'series' => $batch->series,
                'serial' => $serial++,
                'number' => $number,
                'check_character' => $dto->number_template === null
                    ? null
                    : CardNumberTemplate::checkCharacterFor($number),
                'status' => $status->value,
                'issued_at' => $now,
                'assigned_at' => $batch->discount_partner_id ? $now : null,
                'assigned_by' => null,
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

    /**
     * One number per card, unique within the run and against everything already
     * minted. Without a template this stays on the legacy series-serial format,
     * so batches issued before templates existed keep reprinting identically.
     *
     * @return list<string>
     */
    private function mintNumbers(DiscountCardBatch $batch, IssueCardBatchDTO $dto): array
    {
        if ($dto->number_template === null) {
            return array_map(
                fn (int $offset): string => $this->serialGenerator->numberFor($batch->series, $dto->serial_from + $offset),
                range(0, $dto->quantity - 1)
            );
        }

        $template = CardNumberTemplate::compile($dto->number_template);

        if ($template->capacity() < $dto->quantity * self::CAPACITY_HEADROOM) {
            throw new InvalidCardNumberTemplateException(sprintf(
                'The template "%s" can only make about %s distinct numbers, which is too few for %d cards. Add another D or L placeholder.',
                $dto->number_template,
                number_format($template->capacity()),
                $dto->quantity
            ));
        }

        // Drawn at random, so uniqueness is checked rather than assumed. Taken
        // against the whole table because two batches can share a template.
        $numbers = [];
        while (count($numbers) < $dto->quantity) {
            $candidate = $template->generate();
            if (isset($numbers[$candidate])) {
                continue;
            }
            $numbers[$candidate] = true;
        }

        $minted = array_keys($numbers);
        $taken = $this->cardRepository->existingNumbers($minted);

        return $taken === []
            ? $minted
            : $this->remint($template, array_values(array_diff($minted, $taken)), $dto->quantity);
    }

    /**
     * Tops a run back up after a collision with a number already in the table.
     *
     * @param  list<string>  $kept
     * @return list<string>
     */
    private function remint(CardNumberTemplate $template, array $kept, int $quantity): array
    {
        $pool = array_flip($kept);

        while (count($pool) < $quantity) {
            $candidate = $template->generate();
            if (isset($pool[$candidate]) || $this->cardRepository->existingNumbers([$candidate]) !== []) {
                continue;
            }
            $pool[$candidate] = true;
        }

        return array_keys($pool);
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
