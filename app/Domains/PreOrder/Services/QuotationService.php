<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Services;

use App\Domains\PreOrder\Adapters\LaboratoryAdapter;
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
        private readonly LaboratoryAdapter $laboratory,
    ) {}

    /**
     * @param  Collection<int, PreOrderItem>  $items  with test loaded
     * @param  list<FinanceReason>  $reasons
     */
    public function open(PreOrder $preOrder, Collection $items, ?PreOrderRequest $request, array $reasons, QuoteDTO $quote, Actor $actor): PreOrderQuotation
    {
        // A formula or conditional price, worked out from the values entered (e.g. embryos). A line
        // priced this way before can be re-priced with new values on a revised quotation.
        foreach ($quote->params as $itemId => $values) {
            $item = $items->firstWhere('id', $itemId) ?? throw new PreOrderRuleException('Price values were given for a line that is not on this quotation.');
            $item->loadMissing('methodTest.method');
            $rule = $this->laboratory->priceRule($item->test, $preOrder->referrer_id, $item->methodTest);
            if ($rule === null) {
                throw new PreOrderRuleException("{$item->test->name} has a fixed catalogue price; it takes no values.");
            }
            $missing = array_diff($rule['parameters'], array_keys($values));
            if ($missing !== []) {
                throw new PreOrderRuleException("Enter {$this->list($missing)} for {$item->test->name}.");
            }
            $values = array_intersect_key($values, array_flip($rule['parameters']));
            $price = $this->laboratory->unitPrice($item->test, $preOrder->referrer_id, $item->methodTest, $values)
                ?? throw new PreOrderRuleException("No catalogue price for {$item->test->name} matches those values. Check them, or ask the finance team to price it.");
            $this->preOrders->updateItem($item, ['unit_price' => $price, 'price_params' => $values]);
        }

        foreach ($quote->prices as $itemId => $price) {
            $item = $items->firstWhere('id', $itemId) ?? throw new PreOrderRuleException('A price was given for a line that is not on this quotation.');
            if (isset($quote->params[$itemId])) {
                throw new PreOrderRuleException("{$item->test->name} is priced from the values entered; it can't also take a typed price.");
            }
            if ($item->unit_price !== null && $item->price_params === null) {
                throw new PreOrderRuleException("{$item->test->name} has a catalogue price, which can't be changed.");
            }
            $this->preOrders->updateItem($item, ['unit_price' => $price, 'price_params' => null]);
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

    /** @param  array<int, string>  $names */
    private function list(array $names): string
    {
        return implode(', ', array_values($names));
    }
}
