<?php

namespace App\Providers;

use App\Domains\Billing\Events\InvoiceAcceptanceUpdateEvent;
use App\Domains\Billing\Events\PaymentsAddedEvent;
use App\Domains\Billing\Listeners\InvoiceAcceptanceDeletedListener;
use App\Domains\Document\Listeners\DocumentUpdateListener;
use App\Domains\Laboratory\Events\ReportTemplateDocumentUpdateEvent;
use App\Domains\Laboratory\Events\ReferrerOrderEvent;
use App\Domains\Laboratory\Events\SectionEvent;
use App\Domains\Reception\Events\AcceptanceDeletedEvent;
use App\Domains\Reception\Events\PatientDocumentUpdateEvent;
use App\Domains\Reception\Events\ReportPublishedEvent;
use App\Domains\Reception\Events\SampleCollectedEvent;
use App\Domains\Reception\Listeners\AcceptanceInvoiceListener;
use App\Domains\Reception\Listeners\AcceptancePaymentListener;
use App\Domains\Reception\Listeners\AcceptanceReportedListener;
use App\Domains\Reception\Listeners\SampleCollectedListener;
use App\Domains\User\Events\UserDocumentUpdateEvent;
use App\Domains\User\Listeners\SectionPermissionsListener;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Event;

class EventServiceProvider extends ServiceProvider
{

    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        parent::boot();
        Event::listen(
            [
                ReportTemplateDocumentUpdateEvent::class,
                PatientDocumentUpdateEvent::class,
                UserDocumentUpdateEvent::class,
            ],
            [DocumentUpdateListener::class, 'handle']
        );
        Event::listen(
            [
                InvoiceAcceptanceUpdateEvent::class
            ],
            [AcceptanceInvoiceListener::class, 'handle']
        );
        Event::listen(
            [
                PaymentsAddedEvent::class
            ],
            [AcceptancePaymentListener::class, 'handle']
        );
        Event::listen(
            [SectionEvent::class],
            [SectionPermissionsListener::class, 'handle']
        );
        Event::listen(
            [AcceptanceDeletedEvent::class],
            [InvoiceAcceptanceDeletedListener::class, 'handle']
        );
        Event::listen(
            [SampleCollectedEvent::class],
            [SampleCollectedListener::class, 'handle']
        );
        Event::listen(ReportPublishedEvent::class, [AcceptanceReportedListener::class, 'handle']);
    }
}
