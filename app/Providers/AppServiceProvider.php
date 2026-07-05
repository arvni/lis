<?php

namespace App\Providers;

use App\Domains\Billing\Models\Invoice;
use App\Domains\System\Policies\FailedJobPolicy;
use App\Domains\Billing\Models\Payment;
use App\Domains\Billing\Models\Statement;
use App\Domains\Billing\Policies\InvoicePolicy;
use App\Domains\Billing\Policies\PaymentPolicy;
use App\Domains\Billing\Policies\StatementPolicy;
use App\Domains\Consultation\Models\Consultant;
use App\Domains\Consultation\Models\Consultation;
use App\Domains\Consultation\Models\Customer;
use App\Domains\Consultation\Models\Time;
use App\Domains\Consultation\Policies\ConsultantPolicy;
use App\Domains\Consultation\Policies\ConsultationPolicy;
use App\Domains\Consultation\Policies\TimePolicy;
use App\Domains\Document\Models\Document;
use App\Domains\Document\Policies\DocumentPolicy;
use App\Domains\Notification\Policies\NotificationPolicy;
use App\Domains\Laboratory\Models\BarcodeGroup;
use App\Domains\Laboratory\Models\ConsentForm;
use App\Domains\Laboratory\Models\Instruction;
use App\Domains\Laboratory\Models\ReportTemplate;
use App\Domains\Laboratory\Models\RequestForm;
use App\Domains\Laboratory\Models\SampleType;
use App\Domains\Laboratory\Models\Section;
use App\Domains\Laboratory\Models\SectionGroup;
use App\Domains\Laboratory\Services\SectionLookupService;
use App\Domains\Shared\Contracts\SectionLookupInterface;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Laboratory\Models\TestGroup;
use App\Domains\Laboratory\Models\ApprovalFlow;
use App\Domains\Laboratory\Models\Workflow;
use App\Domains\Laboratory\Policies\ApprovalFlowPolicy;
use App\Domains\Laboratory\Policies\BarcodeGroupPolicy;
use App\Domains\Laboratory\Policies\ConsentFormPolicy;
use App\Domains\Laboratory\Policies\InstructionPolicy;
use App\Domains\Laboratory\Policies\ReportTemplatePolicy;
use App\Domains\Laboratory\Policies\RequestFormPolicy;
use App\Domains\Laboratory\Policies\SampleTypePolicy;
use App\Domains\Laboratory\Policies\SectionGroupPolicy;
use App\Domains\Laboratory\Policies\SectionPolicy;
use App\Domains\Laboratory\Policies\TestGroupPolicy;
use App\Domains\Laboratory\Policies\TestPolicy;
use App\Domains\Laboratory\Policies\WorkflowPolicy;
use App\Domains\Reception\Models\Acceptance;
use App\Domains\Reception\Models\AcceptanceItem;
use App\Domains\Reception\Models\AcceptanceItemState;
use App\Domains\Reception\Models\Patient;
use App\Domains\Reception\Models\Report;
use App\Domains\Reception\Models\Sample;
use App\Domains\Reception\Policies\AcceptancePolicy;
use App\Domains\Reception\Policies\PatientPolicy;
use App\Domains\Reception\Policies\ReportPolicy;
use App\Domains\Reception\Policies\SamplePolicy;
use App\Domains\Referrer\Models\Material;
use App\Domains\Referrer\Models\OrderMaterial;
use App\Domains\Referrer\Models\Referrer;
use App\Domains\Referrer\Models\ReferrerOrder;
use App\Domains\Referrer\Models\CollectRequest;
use App\Domains\Referrer\Models\SampleCollector;
use App\Domains\Referrer\Policies\MaterialPolicy;
use App\Domains\Referrer\Policies\OrderMaterialPolicy;
use App\Domains\Referrer\Policies\ReferrerPolicy;
use App\Domains\Referrer\Policies\ReferrerOrderPolicy;
use App\Domains\Referrer\Policies\CollectRequestPolicy;
use App\Domains\Referrer\Policies\SampleCollectorPolicy;
use App\Domains\Monitoring\Models\MonitoringNode;
use App\Domains\Monitoring\Policies\MonitoringNodePolicy;
use App\Domains\Inventory\Models\Item;
use App\Domains\Inventory\Models\Supplier;
use App\Domains\Inventory\Models\Store;
use App\Domains\Inventory\Models\StockTransaction;
use App\Domains\Inventory\Models\PurchaseRequest;
use App\Domains\Inventory\Models\Unit;
use App\Domains\Inventory\Models\WorkflowTemplate;
use App\Domains\Inventory\Policies\ItemPolicy;
use App\Domains\Inventory\Policies\SupplierPolicy;
use App\Domains\Inventory\Policies\StorePolicy;
use App\Domains\Inventory\Policies\StockTransactionPolicy;
use App\Domains\Inventory\Policies\PurchaseRequestApprovalPolicy;
use App\Domains\Inventory\Policies\PurchaseRequestPolicy;
use App\Domains\Inventory\Policies\UnitPolicy;
use App\Domains\Inventory\Policies\WorkflowTemplatePolicy;
use App\Domains\User\Models\Role;
use App\Domains\User\Models\User;
use App\Domains\User\Policies\RolePolicy;
use App\Domains\User\Policies\UserPolicy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(SectionLookupInterface::class, SectionLookupService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if ($this->app->environment('production') && ! $this->app->runningInConsole()) {
            if (Artisan::call('env:validate') !== 0) {
                abort(500, 'Environment validation failed. Check server logs.');
            }
        }

        DB::listen(function ($query) {
            if ($query->time > 1000) {
                Log::warning('🚨 Slow Query Detected: ' . $query->sql, [
                    'bindings' => $query->bindings,
                    'time' => $query->time
                ]);
            }
        });

        Vite::prefetch(concurrency: 3);

        // Fail loud on N+1 (lazy-loading violations) in dev/staging so they surface during
        // development; in production degrade gracefully — a missing eager-load lazy-loads
        // (an N+1) instead of throwing LazyLoadingViolationException and 500-ing the request.
        Model::preventLazyLoading(! $this->app->isProduction());

        Relation::morphMap([
            'user' => User::class,
            "role" => Role::class,
            "document" => Document::class,
            "patient" => Patient::class,
            "reporttemplate" => ReportTemplate::class,
            "acceptance" => Acceptance::class,
            "acceptanceitem" => AcceptanceItem::class,
            "acceptanceitemstate" => AcceptanceItemState::class,
            "report" => Report::class,
            "referrer" => Referrer::class,
            "invoice" => Invoice::class,
            "consultation" => Consultation::class,
            "consultant" => Consultant::class,
            "customer" => Customer::class,
            "referrerOrder" => ReferrerOrder::class,
            "requestform" => RequestForm::class,
            "consentform" => ConsentForm::class,
            "instruction" => Instruction::class
        ]);

        Gate::policy(User::class, UserPolicy::class);
        Gate::policy(Role::class, RolePolicy::class);

        Gate::policy(Acceptance::class, AcceptancePolicy::class);
        Gate::policy(Sample::class, SamplePolicy::class);
        Gate::policy(Report::class, ReportPolicy::class);
        Gate::policy(Patient::class, PatientPolicy::class);

        Gate::policy(SectionGroup::class, SectionGroupPolicy::class);
        Gate::policy(Section::class, SectionPolicy::class);
        Gate::policy(Workflow::class, WorkflowPolicy::class);
        Gate::policy(ApprovalFlow::class, ApprovalFlowPolicy::class);
        Gate::policy(SampleType::class, SampleTypePolicy::class);
        Gate::policy(BarcodeGroup::class, BarcodeGroupPolicy::class);
        Gate::policy(TestGroup::class, TestGroupPolicy::class);
        Gate::policy(ReportTemplate::class, ReportTemplatePolicy::class);
        Gate::policy(RequestForm::class, RequestFormPolicy::class);
        Gate::policy(ConsentForm::class, ConsentFormPolicy::class);
        Gate::policy(Instruction::class, InstructionPolicy::class);
        Gate::policy(Test::class, TestPolicy::class);


        Gate::policy(Consultation::class, ConsultationPolicy::class);
        Gate::policy(Consultant::class, ConsultantPolicy::class);
        Gate::policy(Time::class, TimePolicy::class);

        Gate::policy(Referrer::class, ReferrerPolicy::class);
        Gate::policy(ReferrerOrder::class, ReferrerOrderPolicy::class);
        Gate::policy(OrderMaterial::class, OrderMaterialPolicy::class);
        Gate::policy(Material::class, MaterialPolicy::class);
        Gate::policy(CollectRequest::class, CollectRequestPolicy::class);
        Gate::policy(SampleCollector::class, SampleCollectorPolicy::class);

        $failedJobPolicy = new FailedJobPolicy();
        Gate::define('failed-jobs.list',   fn($user) => $failedJobPolicy->viewAny($user));
        Gate::define('failed-jobs.retry',  fn($user) => $failedJobPolicy->retry($user));
        Gate::define('failed-jobs.delete', fn($user) => $failedJobPolicy->delete($user));

        $notificationPolicy = new NotificationPolicy();
        Gate::define('notifications.manage-whatsapp', fn($user) => $notificationPolicy->manageWhatsapp($user));

        Gate::policy(Invoice::class, InvoicePolicy::class);
        Gate::policy(Payment::class, PaymentPolicy::class);
        Gate::policy(Statement::class, StatementPolicy::class);

        Gate::policy(Document::class, DocumentPolicy::class);
        Gate::policy(MonitoringNode::class, MonitoringNodePolicy::class);

        Gate::policy(Item::class, ItemPolicy::class);
        Gate::policy(Supplier::class, SupplierPolicy::class);
        Gate::policy(Store::class, StorePolicy::class);
        Gate::policy(StockTransaction::class, StockTransactionPolicy::class);
        Gate::policy(PurchaseRequest::class, PurchaseRequestPolicy::class);
        Gate::policy(Unit::class, UnitPolicy::class);
        Gate::policy(WorkflowTemplate::class, WorkflowTemplatePolicy::class);

        // Workflow-approver abilities: PurchaseRequest already has PurchaseRequestPolicy
        // (Laravel allows one Gate::policy per model), so the approver-identity checks are
        // registered as gate abilities backed by PurchaseRequestApprovalPolicy. The string
        // "Class@method" form is container-resolved, so the policy's workflow-service
        // dependency is injected.
        Gate::define('purchase-requests.approve-step', PurchaseRequestApprovalPolicy::class . '@approveStep');
        Gate::define('purchase-requests.reject-step', PurchaseRequestApprovalPolicy::class . '@rejectStep');
        Gate::define('purchase-requests.delegate-step', PurchaseRequestApprovalPolicy::class . '@delegateStep');
        Gate::define('purchase-requests.recall', PurchaseRequestApprovalPolicy::class . '@recall');
        Gate::define('purchase-requests.bulk-approve', PurchaseRequestApprovalPolicy::class . '@bulkApprove');
    }
}
