<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Services;

use App\Domains\Document\Enums\DocumentTag;
use App\Domains\PreOrder\DTOs\Actor;
use App\Domains\PreOrder\DTOs\CreatePreOrderDTO;
use App\Domains\PreOrder\DTOs\FinanceDecisionDTO;
use App\Domains\PreOrder\Enums\ExceptionType;
use App\Domains\PreOrder\Enums\PreOrderActionType as Type;
use App\Domains\PreOrder\Events\PreOrderActionProcessed;
use App\Domains\PreOrder\Exceptions\PreOrderRuleException;
use App\Domains\PreOrder\Models\PreOrder;
use App\Domains\PreOrder\Models\PreOrderAction;
use App\Domains\PreOrder\Repositories\PreOrderActionRepository;
use App\Domains\PreOrder\Repositories\PreOrderRepository;
use App\Domains\PreOrder\Support\PreOrderActionRules;
use App\Domains\PreOrder\Support\UploadInspector;
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
        private readonly UploadInspector $inspector,
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
            Type::UPLOAD_DOCUMENT => $this->upload($preOrder, $payload, $actor),
            Type::DECIDE_FINANCE => $this->workflow->decideFinance($preOrder, FinanceDecisionDTO::fromArray($payload), $actor),
            Type::CONFIRM_NEXT_STEP => $this->workflow->confirmNextStep($preOrder, $payload['note'] ?? null, $actor),
            Type::ADD_BATCH => $this->workflow->addBatch($preOrder, $payload['label'] ?? null, $payload['replaces'] ?? null, $actor),
            Type::CLOSE_BATCHES => $this->workflow->closeBatches($preOrder, $actor),
            Type::RESYNC => $this->workflow->resend($preOrder),
        };
    }

    /**
     * The file api left in the incoming folder is inspected, stored as a clean copy and always
     * removed from the folder, accepted or not.
     *
     * @param  array<string, mixed>  $payload
     */
    private function upload(PreOrder $preOrder, array $payload, Actor $actor): PreOrder
    {
        $incoming = rtrim((string) config('services.preorder_uploads.incoming'), '/').'/'.$payload['file'];
        $upload = null;
        try {
            $upload = $this->inspector->inspect($incoming, pathinfo($payload['file'], PATHINFO_EXTENSION));

            return $this->workflow->addDocument($preOrder, $upload, self::cleanName($payload['name']), DocumentTag::from($payload['tag']), isset($payload['request']) ? (int) $payload['request'] : null, $actor);
        } finally {
            $upload?->discard();
            if (is_file($incoming)) {
                @unlink($incoming);
            }
        }
    }

    /** A display name only: no path parts, control characters or markup-looking characters. */
    private static function cleanName(string $name): string
    {
        $name = basename(str_replace('\\', '/', $name));
        $name = (string) preg_replace('/[\x00-\x1F\x7F<>:"|?*]+/u', '', $name);
        $name = trim(mb_substr($name, 0, 120));

        return $name !== '' ? $name : 'document';
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
