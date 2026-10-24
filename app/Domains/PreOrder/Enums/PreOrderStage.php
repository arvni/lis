<?php

declare(strict_types=1);

namespace App\Domains\PreOrder\Enums;

use Kongulov\Traits\InteractWithEnum;

/**
 * The fixed stage library. Every flow picks a subset of these in this order, so a pre-order only
 * ever moves forward; anything BION needs later is an open request on top of the stage.
 * A new case is a deliberate developer change: notifications, reminders and reports key off them.
 */
enum PreOrderStage: string
{
    use InteractWithEnum;

    case DRAFT = 'DRAFT';
    case SUBMITTED = 'SUBMITTED';
    case UNDER_REVIEW = 'UNDER_REVIEW';
    case AWAITING_INFO = 'AWAITING_INFO';
    case INFO_REVIEW = 'INFO_REVIEW';
    case AWAITING_FINANCE = 'AWAITING_FINANCE';
    case FINANCE_VERIFY = 'FINANCE_VERIFY';
    case AWAITING_PRE_SAMPLES = 'AWAITING_PRE_SAMPLES';
    case PRE_RECEIVED = 'PRE_RECEIVED';
    case PRE_IN_PROGRESS = 'PRE_IN_PROGRESS';
    case PRE_COMPLETED = 'PRE_COMPLETED';
    case AWAITING_SAMPLES = 'AWAITING_SAMPLES';
    case BATCH_OPEN = 'BATCH_OPEN';
    case READY_FOR_TESTING = 'READY_FOR_TESTING';
    case TESTING = 'TESTING';
    case TESTING_COMPLETED = 'TESTING_COMPLETED';
    case RESULTS_RELEASED = 'RESULTS_RELEASED';

    public function rank(): int
    {
        return (int) array_search($this, self::cases(), true);
    }

    public function defaultOwner(): ActionOwner
    {
        return match ($this) {
            self::DRAFT, self::AWAITING_INFO, self::AWAITING_FINANCE, self::AWAITING_PRE_SAMPLES,
            self::PRE_COMPLETED, self::AWAITING_SAMPLES, self::BATCH_OPEN => ActionOwner::CENTER,
            self::RESULTS_RELEASED => ActionOwner::NONE,
            default => ActionOwner::BION,
        };
    }

    /**
     * Stages every flow uses. The review loop (2–4) is shared too: a pre-order sent without tests
     * has no flow yet, and has to be able to reach review and ask for information.
     */
    public function isAlwaysOn(): bool
    {
        return in_array($this, [
            self::DRAFT, self::SUBMITTED, self::UNDER_REVIEW, self::AWAITING_INFO, self::INFO_REVIEW,
            self::AWAITING_SAMPLES, self::TESTING, self::TESTING_COMPLETED, self::RESULTS_RELEASED,
        ], true);
    }

    public function isOptional(): bool
    {
        return ! $this->isAlwaysOn();
    }

    /** Never set by hand: these follow the linked orders' lab statuses. */
    public function isReadFromOrders(): bool
    {
        return in_array($this, [
            self::PRE_RECEIVED, self::PRE_IN_PROGRESS, self::TESTING, self::TESTING_COMPLETED, self::RESULTS_RELEASED,
        ], true);
    }

    /** The review loop, where a request moves the stage instead of sitting on top of it. */
    public function isReview(): bool
    {
        return in_array($this, [self::UNDER_REVIEW, self::AWAITING_INFO, self::INFO_REVIEW], true);
    }

    public function isFinal(): bool
    {
        return $this === self::RESULTS_RELEASED;
    }

    /** What the center reads; a flow can override it per stage. */
    public function label(): string
    {
        return match ($this) {
            self::DRAFT => 'Draft',
            self::SUBMITTED => 'New request submitted',
            self::UNDER_REVIEW => 'Under BION review',
            self::AWAITING_INFO => 'Waiting for documents / additional information',
            self::INFO_REVIEW => 'Information received – under BION review',
            self::AWAITING_FINANCE => 'Waiting for financial approval',
            self::FINANCE_VERIFY => 'Approval received – BION check',
            self::AWAITING_PRE_SAMPLES => 'Waiting for pre-test samples',
            self::PRE_RECEIVED => 'Pre-test samples received',
            self::PRE_IN_PROGRESS => 'Pre-test workup in progress',
            self::PRE_COMPLETED => 'Pre-test workup completed',
            self::AWAITING_SAMPLES => 'Waiting for samples',
            self::BATCH_OPEN => 'Samples received – more batches expected',
            self::READY_FOR_TESTING => 'Batches closed – ready for testing',
            self::TESTING => 'Testing in progress',
            self::TESTING_COMPLETED => 'Testing completed – report in review',
            self::RESULTS_RELEASED => 'Results released',
        };
    }

    public function nextAction(): ?string
    {
        return match ($this) {
            self::DRAFT => 'Complete and submit the pre-order',
            self::SUBMITTED, self::UNDER_REVIEW => 'BION is reviewing the request',
            self::AWAITING_INFO => 'Answer BION’s request or upload the documents',
            self::INFO_REVIEW => 'BION is reviewing the information',
            self::AWAITING_FINANCE => 'Approve the quotation',
            self::FINANCE_VERIFY => 'BION is checking the approval',
            self::AWAITING_PRE_SAMPLES => 'Send the pre-test samples',
            self::PRE_RECEIVED, self::PRE_IN_PROGRESS => 'BION is running the pre-test workup',
            self::PRE_COMPLETED => 'Confirm the next step',
            self::AWAITING_SAMPLES => 'Send the samples',
            self::BATCH_OPEN => 'Add another batch, or tell BION there are no more',
            self::READY_FOR_TESTING => 'BION is checking the samples',
            self::TESTING => 'The lab is testing',
            self::TESTING_COMPLETED => 'The report is being reviewed',
            self::RESULTS_RELEASED => null,
        };
    }
}
