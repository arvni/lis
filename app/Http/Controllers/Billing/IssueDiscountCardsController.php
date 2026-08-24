<?php

declare(strict_types=1);

namespace App\Http\Controllers\Billing;

use App\Domains\Billing\DTOs\IssueCardBatchDTO;
use App\Domains\Billing\Requests\IssueDiscountCardsRequest;
use App\Domains\Billing\Services\DiscountCardIssuanceService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;

class IssueDiscountCardsController extends Controller
{
    public function __construct(private readonly DiscountCardIssuanceService $issuanceService) {}

    public function __invoke(IssueDiscountCardsRequest $request): RedirectResponse
    {
        $dto = IssueCardBatchDTO::fromArray($request->validated());
        $batch = $this->issuanceService->issue($dto, $request->user()?->id);

        return back()->with([
            'success' => true,
            'status' => "Issued $dto->quantity cards in series $batch->series",
        ]);
    }
}
