<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Services;

use App\Domains\PreOrder\DTOs\Actor;
use App\Domains\PreOrder\DTOs\QuoteDTO;
use App\Domains\PreOrder\Enums\FinanceReason;
use App\Domains\PreOrder\Enums\FinanceStatus;
use App\Domains\PreOrder\Events\QuotationSent;
use App\Domains\PreOrder\Exceptions\PreOrderRuleException;
use App\Domains\PreOrder\Models\PreOrder;
use App\Domains\PreOrder\Models\PreOrderItem;
use App\Domains\PreOrder\Models\PreOrderQuotation;
use App\Domains\PreOrder\Models\PreOrderRequest;
use App\Domains\PreOrder\Repositories\PreOrderRepository;
use App\Domains\PreOrder\Repositories\QuotationRepository;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Prices a set of test lines into a quotation for the center. Called only from PreOrderWorkflow,
 * inside its transaction, so the stage and the quotation always change together.
 */
class QuotationService
{
    public const VALID_DAYS = 30;

    public function __construct(
        private readonly QuotationRepository $quotations,
        private readonly PreOrderRepository $preOrders,
    ) {}

    /**
     * @param  Collection<int, PreOrderItem>  $items  with test loaded
     * @param  list<FinanceReason>  $reasons
     */
    public function open(PreOrder $preOrder, Collection $items, ?PreOrderRequest $request, array $reasons, QuoteDTO $quote, Actor $actor): PreOrderQuotation
    {
        foreach ($quote->prices as $itemId => $price) {
            $item = $items->firstWhere('id', $itemId) ?? throw new PreOrderRuleException('A price was given for a line that is not on this quotation.');
            if ($item->unit_price !== null) {
                throw new PreOrderRuleException("{$item->test->name} has a catalogue price, which can't be changed.");
            }
            $this->preOrders->updateItem($item, ['unit_price' => $price]);
        }

        $subtotal = '0';
        foreach ($items as $item) {
            $line = $item->lineTotal() ?? throw new PreOrderRuleException("Set a price for {$item->test->name}; the catalogue has none for this center.");
            $subtotal = bcadd($subtotal, $line, 3);
        }
        if (bccomp($quote->discount, '0', 3) < 0 || bccomp($quote->discount, $subtotal, 3) > 0) {
            throw new PreOrderRuleException('The discount must be between zero and the quotation total.');
        }

        $quotation = $this->quotations->create($preOrder, [
            'request_id' => $request?->id,
            'number' => $this->nextNumber($preOrder),
            'reasons' => array_map(fn (FinanceReason $r) => $r->value, $reasons),
            'reason' => $quote->reason,
            'status' => FinanceStatus::AWAITING_CENTER,
            'subtotal' => $subtotal,
            'discount' => $quote->discount,
            'total' => bcsub($subtotal, $quote->discount, 3),
            'expires_at' => now()->addDays(self::VALID_DAYS)->endOfDay(),
            'created_by' => $actor->userId,
        ]);
        foreach ($items as $item) {
            $this->preOrders->updateItem($item, ['quotation_id' => $quotation->id]);
        }
        DB::afterCommit(fn () => QuotationSent::dispatch($quotation));

        return $quotation;
    }

    /**
     * The approved amount of a partial approval: the kept lines, less the discount in proportion,
     * so a discount given on the whole quotation still applies to what the center keeps.
     *
     * @param  Collection<int, PreOrderItem>  $kept
     */
    public function approvedAmount(PreOrderQuotation $quotation, Collection $kept): string
    {
        $sum = $kept->reduce(fn (string $carry, PreOrderItem $i) => bcadd($carry, $i->lineTotal() ?? '0', 3), '0');
        if (bccomp((string) $quotation->subtotal, '0', 3) === 0) {
            return '0.000';
        }
        $share = bcdiv(bcmul($sum, (string) $quotation->discount, 6), (string) $quotation->subtotal, 3);

        return bcsub($sum, $share, 3);
    }

    /** Q-YY-NNNN from the pre-order code, then -2, -3… so every quotation on a case shares its root. */
    private function nextNumber(PreOrder $preOrder): string
    {
        $root = 'Q'.substr($preOrder->code, 2);
        $count = $this->quotations->count($preOrder);

        return $count === 0 ? $root : $root.'-'.($count + 1);
    }
}
