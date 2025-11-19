<?php

namespace App\Providers;

use App\Domains\Billing\Events\InvoiceAcceptanceUpdateEvent;
use App\Domains\Billing\Events\PaymentsAddedEvent;
use App\Domains\Billing\Listeners\InvoiceAcceptanceDeletedListener;
use App\Domains\Document\Listeners\DocumentUpdateListener;
use App\Domains\Laboratory\Events\ConsentFormDocumentUpdateEvent;
use App\Domains\Laboratory\Events\ConsentFormUpdated;
use App\Domains\Laboratory\Events\InstructionDocumentUpdateEvent;
use App\Domains\Laboratory\Events\InstructionUpdated;
use App\Domains\Laboratory\Events\ReportTemplateDocumentUpdateEvent;
use App\Domains\Laboratory\Events\RequestFormDocumentUpdateEvent;
use App\Domains\Laboratory\Events\RequestFormUpdated;
use App\Domains\Laboratory\Events\SampleTypeUpdated;
use App\Domains\Laboratory\Events\SectionEvent;
use App\Domains\Notification\Listeners\NotifyProviderOfConsentFormUpdate;
use App\Domains\Notification\Listeners\NotifyProviderOfInstructionUpdate;
use App\Domains\Notification\Listeners\NotifyProviderOfOrderMaterialUpdate;
use App\Domains\Notification\Listeners\NotifyProviderOfRequestFormUpdate;
use App\Domains\Notification\Listeners\NotifyProviderOfSampleTypeUpdate;
use App\Domains\Notification\Listeners\NotifyLogisticsAppOfCollectRequestUpdate;
use App\Domains\Reception\Events\AcceptanceDeletedEvent;
use App\Domains\Reception\Events\PatientDocumentUpdateEvent;
use App\Domains\Reception\Events\ReportPublishedEvent;
use App\Domains\Reception\Events\SampleCollectedEvent;
use App\Domains\Reception\Listeners\AcceptanceInvoiceListener;
use App\Domains\Reception\Listeners\AcceptancePaymentListener;
use App\Domains\Reception\Listeners\AcceptanceReportedListener;
use App\Domains\Reception\Listeners\SampleCollectedListener;
use App\Domains\Referrer\Events\OrderMaterialUpdated;
use App\Domains\Referrer\Events\CollectRequestEvent;
use App\Domains\User\Events\UserDocumentUpdateEvent;
use App\Events\ReferrerOrderPatientCreated;
use App\Listeners\SendPatientToProviderWebhook;
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
                InstructionDocumentUpdateEvent::class,
                RequestFormDocumentUpdateEvent::class,
                ConsentFormDocumentUpdateEvent::class,
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
        Event::listen(OrderMaterialUpdated::class, [NotifyProviderOfOrderMaterialUpdate::class, 'handle']);
        Event::listen(RequestFormUpdated::class, [NotifyProviderOfRequestFormUpdate::class, 'handle']);
        Event::listen(ConsentFormUpdated::class, [NotifyProviderOfConsentFormUpdate::class, 'handle']);
        Event::listen(InstructionUpdated::class, [NotifyProviderOfInstructionUpdate::class, 'handle']);
        Event::listen(SampleTypeUpdated::class, [NotifyProviderOfSampleTypeUpdate::class, 'handle']);
        Event::listen(CollectRequestEvent::class, [NotifyLogisticsAppOfCollectRequestUpdate::class, 'handle']);
        Event::listen(ReferrerOrderPatientCreated::class, [SendPatientToProviderWebhook::class, 'handle']);
    }
}
