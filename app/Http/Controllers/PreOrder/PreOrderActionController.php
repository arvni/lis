<?php

declare(strict_types=1);

namespace App\Http\Controllers\PreOrder;

use App\Domains\Document\Enums\DocumentTag;
use App\Domains\PreOrder\DTOs\Actor;
use App\Domains\PreOrder\DTOs\QuoteDTO;
use App\Domains\PreOrder\DTOs\RaiseRequestDTO;
use App\Domains\PreOrder\Enums\ExceptionType;
use App\Domains\PreOrder\Exceptions\PreOrderRuleException;
use App\Domains\PreOrder\Models\PreOrder;
use App\Domains\PreOrder\Requests\AddPreOrderTestRequest;
use App\Domains\PreOrder\Requests\AssignPreOrderRequest;
use App\Domains\PreOrder\Requests\ClosePreOrderRequest;
use App\Domains\PreOrder\Requests\ConfirmPreOrderRequest;
use App\Domains\PreOrder\Requests\PreOrderNoteRequest;
use App\Domains\PreOrder\Requests\PreOrderReasonRequest;
use App\Domains\PreOrder\Requests\PreOrderSampleIssueRequest;
use App\Domains\PreOrder\Requests\RaisePreOrderRequestRequest;
use App\Domains\PreOrder\Requests\SetPreOrderMainTestRequest;
use App\Domains\PreOrder\Requests\SetPreOrderPreTestRequest;
use App\Domains\PreOrder\Requests\StorePreOrderDocumentRequest;
use App\Domains\PreOrder\Services\PreOrderWorkflow;
use App\Domains\User\Models\User;
use App\Http\Controllers\Controller;
use Closure;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;

/**
 * BION's stage actions on a pre-order. Each one is authorised by its FormRequest (or the policy),
 * runs through PreOrderWorkflow, and returns to the page with the rule message when refused.
 */
class PreOrderActionController extends Controller
{
    public function __construct(private readonly PreOrderWorkflow $workflow) {}

    public function openReview(Request $request, PreOrder $preOrder): RedirectResponse
    {
        $this->authorize('review', $preOrder);

        return $this->run(fn () => $this->workflow->openReview($preOrder, $this->actor($request)), 'Review opened.');
    }

    public function assign(AssignPreOrderRequest $request, PreOrder $preOrder): RedirectResponse
    {
        $userId = $request->validated('user_id');

        return $this->run(fn () => $this->workflow->assign($preOrder, $userId ? (int) $userId : null, $this->actor($request)), 'Counsellor updated.');
    }

    public function setMainTest(SetPreOrderMainTestRequest $request, PreOrder $preOrder): RedirectResponse
    {
        return $this->run(fn () => $this->workflow->setMainTest(
            $preOrder,
            (int) $request->validated('test_id'),
            $request->validated('reason'),
            $this->actor($request),
        ), 'Main test set.');
    }

    public function addTest(AddPreOrderTestRequest $request, PreOrder $preOrder): RedirectResponse
    {
        return $this->run(fn () => $this->workflow->addTest(
            $preOrder,
            (int) $request->validated('test_id'),
            $request->validated('patient_ref'),
            (int) ($request->validated('qty') ?? 1),
            $this->actor($request),
        ), 'Test added.');
    }

    public function dropItem(PreOrderReasonRequest $request, PreOrder $preOrder, int $item): RedirectResponse
    {
        return $this->run(fn () => $this->workflow->dropItem($preOrder, $item, $request->validated('reason'), $this->actor($request)), 'Test removed.');
    }

    public function setPreTest(SetPreOrderPreTestRequest $request, PreOrder $preOrder, int $item): RedirectResponse
    {
        $preTest = (bool) $request->validated('pre_test');

        return $this->run(fn () => $this->workflow->setPreTest($preOrder, $item, $preTest, $this->actor($request)), $preTest ? 'Marked as a pre-test.' : 'No longer a pre-test.');
    }

    public function raiseRequest(RaisePreOrderRequestRequest $request, PreOrder $preOrder): RedirectResponse
    {
        return $this->run(fn () => $this->workflow->raiseRequest($preOrder, RaiseRequestDTO::fromArray($request->validated()), $this->actor($request)), 'Request sent to the center.');
    }

    public function closeRequest(PreOrderReasonRequest $request, PreOrder $preOrder, int $number): RedirectResponse
    {
        return $this->run(fn () => $this->workflow->closeRequest(
            $preOrder,
            $number,
            (bool) $request->validated('declined', false),
            $request->validated('reason'),
            $this->actor($request),
        ), 'Request closed.');
    }

    public function confirm(ConfirmPreOrderRequest $request, PreOrder $preOrder): RedirectResponse
    {
        return $this->run(fn () => $this->workflow->confirmTests($preOrder, $this->actor($request), QuoteDTO::fromArray($request->validated())), 'Tests confirmed.');
    }

    public function verifyFinance(Request $request, PreOrder $preOrder): RedirectResponse
    {
        $this->authorize('quote', $preOrder);

        return $this->run(fn () => $this->workflow->verifyFinance($preOrder, $this->actor($request)), 'Approval checked; tests released.');
    }

    public function reviseQuotation(PreOrderReasonRequest $request, PreOrder $preOrder): RedirectResponse
    {
        return $this->run(fn () => $this->workflow->reviseQuotation($preOrder, $request->validated('reason'), $this->actor($request)), 'Back in review to revise the quotation.');
    }

    public function confirmNextStep(PreOrderReasonRequest $request, PreOrder $preOrder): RedirectResponse
    {
        return $this->run(fn () => $this->workflow->confirmNextStep($preOrder, $request->validated('reason'), $this->actor($request)), 'Next step confirmed; main tests released.');
    }

    public function closeBatches(Request $request, PreOrder $preOrder): RedirectResponse
    {
        $this->authorize('review', $preOrder);

        return $this->run(fn () => $this->workflow->closeBatches($preOrder, $this->actor($request)), 'Batches closed.');
    }

    public function startTesting(Request $request, PreOrder $preOrder): RedirectResponse
    {
        $this->authorize('startTesting', $preOrder);

        return $this->run(fn () => $this->workflow->startTesting($preOrder, $this->actor($request)), 'Testing started.');
    }

    public function sampleIssue(PreOrderSampleIssueRequest $request, PreOrder $preOrder): RedirectResponse
    {
        return $this->run(fn () => $this->workflow->raiseSampleIssue($preOrder, $request->validated('batch'), $request->validated('reason'), $this->actor($request)), 'Sample issue sent to the center.');
    }

    public function note(PreOrderNoteRequest $request, PreOrder $preOrder): RedirectResponse
    {
        $internal = (bool) $request->validated('internal', false);

        return $this->run(
            fn () => $this->workflow->message($preOrder, $request->validated('body'), $this->actor($request), $internal),
            $internal ? 'Note saved.' : 'Message sent.',
        );
    }

    public function document(StorePreOrderDocumentRequest $request, PreOrder $preOrder): RedirectResponse
    {
        $shared = (bool) $request->validated('shared', false);
        /** @var UploadedFile $file */
        $file = $request->file('file');

        return $this->run(
            fn () => $this->workflow->addStaffDocument($preOrder, $file, DocumentTag::from((string) $request->validated('tag')), $shared, $this->actor($request)),
            $shared ? 'File attached and shared with the center.' : 'File attached (BION only).',
        );
    }

    public function hold(PreOrderReasonRequest $request, PreOrder $preOrder): RedirectResponse
    {
        return $this->run(fn () => $this->workflow->hold($preOrder, 'bion_hold', $request->validated('reason'), $this->actor($request)), 'Put on hold.');
    }

    public function resume(Request $request, PreOrder $preOrder): RedirectResponse
    {
        $this->authorize('review', $preOrder);

        return $this->run(fn () => $this->workflow->resume($preOrder, $this->actor($request)), 'Resumed.');
    }

    public function close(ClosePreOrderRequest $request, PreOrder $preOrder): RedirectResponse
    {
        $override = (bool) $request->validated('override', false);
        if ($override) {
            $this->authorize('override', $preOrder);
        }

        return $this->run(fn () => $this->workflow->close(
            $preOrder,
            ExceptionType::from($request->validated('type')),
            $request->validated('reason'),
            $request->validated('comment'),
            $this->actor($request),
            $override,
        ), 'Pre-order closed.');
    }

    private function actor(Request $request): Actor
    {
        /** @var User $user */
        $user = $request->user();

        return Actor::bion($user);
    }

    private function run(Closure $action, string $done): RedirectResponse
    {
        try {
            $action();
        } catch (PreOrderRuleException $e) {
            return back()->withErrors(['action' => $e->getMessage()]);
        }

        return back()->with(['success' => true, 'status' => $done]);
    }
}
