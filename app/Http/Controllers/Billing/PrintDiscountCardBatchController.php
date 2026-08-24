<?php

declare(strict_types=1);

namespace App\Http\Controllers\Billing;

use App\Domains\Billing\Models\DiscountCard;
use App\Domains\Billing\Models\DiscountCardBatch;
use App\Domains\Billing\Services\DiscountCardService;
use App\Http\Controllers\Controller;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PrintDiscountCardBatchController extends Controller
{
    public function __construct(private readonly DiscountCardService $cardService) {}

    /**
     * A print sheet of at most DiscountCardService::PRINT_CHUNK cards; big batches are
     * printed range by range rather than rendering thousands of QR images at once.
     *
     * @throws AuthorizationException
     */
    public function __invoke(DiscountCardBatch $batch, Request $request): Response
    {
        $this->authorize('print', DiscountCard::class);

        $from = max(1, (int) $request->integer('from', 1));
        $to = (int) $request->integer('to', $from + DiscountCardService::PRINT_CHUNK - 1);
        $to = min($to, $from + DiscountCardService::PRINT_CHUNK - 1, $batch->quantity);

        $batch->loadMissing('partner:id,name');

        return Inertia::render('DiscountCard/PrintBatch', [
            'batch' => [
                'id' => $batch->id,
                'series' => $batch->series,
                'quantity' => $batch->quantity,
                'partner' => $batch->partner?->name,
                'expires_at' => $batch->expires_at?->format('Y-m-d'),
            ],
            'range' => ['from' => $from, 'to' => $to],
            'cards' => $this->cardService->buildPrintSheet($batch, $from, $to),
        ]);
    }
}
