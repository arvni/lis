<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Services;

use App\Domains\PreOrder\DTOs\Actor;
use App\Domains\PreOrder\DTOs\CreatePreOrderDTO;
use App\Domains\PreOrder\Enums\ExceptionType;
use App\Domains\PreOrder\Enums\PreOrderActionType as Type;
use App\Domains\PreOrder\Events\PreOrderActionProcessed;
use App\Domains\PreOrder\Exceptions\PreOrderRuleException;
use App\Domains\PreOrder\Models\PreOrder;
use App\Domains\PreOrder\Models\PreOrderAction;
use App\Domains\PreOrder\Repositories\PreOrderActionRepository;
use App\Domains\PreOrder\Repositories\PreOrderRepository;
use App\Domains\PreOrder\Support\PreOrderActionRules;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Throwable;

/**
 * Applies the center actions api wrote to pre_order_actions. Each row is claimed once, so a
 * retried or duplicated action is ignored; a rejected one is answered with its reason.
 */
class PreOrderInbox
{
    public function __construct(
        private readonly PreOrderActionRepository $actions,
        private readonly PreOrderRepository $preOrders,
        private readonly PreOrderWorkflow $workflow,
    ) {}

    /** @return int how many actions were handled */
    public function processPending(int $limit = 100): int
    {
        $handled = 0;
        foreach ($this->actions->pending($limit) as $pending) {
            $this->processOne($pending->id);
            $handled++;
        }

        return $handled;
    }

    public function processOne(int $actionId): void
    {
        try {
            $action = DB::transaction(function () use ($actionId) {
                $action = $this->actions->claim($actionId);
                if (! $action) {
                    return null;
                }
                $preOrder = $this->apply($action);
                $this->actions->markDone($action, $preOrder->id);

                return $action;
            });
        } catch (PreOrderRuleException|ValidationException $e) {
            $action = $this->fail($actionId, $e instanceof ValidationException ? collect($e->errors())->flatten()->first() : $e->getMessage());
        } catch (Throwable $e) {
            report($e);
            $action = $this->fail($actionId, 'BION could not process this action. Please try again later.');
        }

        if ($action) {
            PreOrderActionProcessed::dispatch($action->refresh());
        }
    }

    private function apply(PreOrderAction $action): PreOrder
    {
        $type = Type::tryFrom($action->type) ?? throw new PreOrderRuleException('Unknown action.');
        $payload = Validator::make($action->payload, PreOrderActionRules::for($type))->validate();
        $actor = Actor::center($action->actor['name'] ?? null);

        if ($type === Type::CREATE) {
            $preOrder = $this->workflow->createDraft($action->referrer_id, CreatePreOrderDTO::fromArray($payload), $actor);

            return ($payload['submit'] ?? false) ? $this->workflow->submit($preOrder, $actor) : $preOrder;
        }

        $preOrder = $action->pre_order_id ? $this->preOrders->findById($action->pre_order_id) : null;
        // A center can only ever touch its own pre-orders, whatever id api passed through.
        if (! $preOrder || $preOrder->referrer_id !== $action->referrer_id) {
            throw new PreOrderRuleException('Pre-order not found.');
        }

        return match ($type) {
            Type::SUBMIT => $this->workflow->submit($preOrder, $actor),
            Type::ANSWER_REQUEST => $this->workflow->answerRequest($preOrder, (int) $payload['request'], $payload['answer'], $actor),
            Type::MESSAGE => $this->workflow->message($preOrder, $payload['body'], $actor),
            Type::REQUEST_HOLD => $this->workflow->hold($preOrder, $payload['reason'], $payload['comment'] ?? null, $actor),
            Type::RESUME => $this->workflow->resume($preOrder, $actor),
            Type::CANCEL => $this->workflow->close($preOrder, ExceptionType::CANCELLED, $payload['reason'], $payload['comment'] ?? null, $actor),
            // Uploads stay closed until the file checks (type sniffing, re-encoding, PDF inspection, virus scan) ship.
            Type::UPLOAD_DOCUMENT => throw new PreOrderRuleException('File uploads are not available yet.'),
            Type::DECIDE_FINANCE, Type::ADD_BATCH, Type::CLOSE_BATCHES => throw new PreOrderRuleException('This action is not available yet.'),
        };
    }

    private function fail(int $actionId, string $error): ?PreOrderAction
    {
        return DB::transaction(function () use ($actionId, $error) {
            $action = $this->actions->claim($actionId);
            if ($action) {
                $this->actions->markFailed($action, $error);
            }

            return $action;
        });
    }
}
