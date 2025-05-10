<?php

namespace App\Providers;

use App\Domains\Billing\Models\Invoice;
use App\Domains\Billing\Policies\InvoicePolicy;
use App\Domains\Consultation\Models\Consultant;
use App\Domains\Consultation\Models\Consultation;
use App\Domains\Consultation\Models\Customer;
use App\Domains\Consultation\Policies\ConsultantPolicy;
use App\Domains\Consultation\Policies\ConsultationPolicy;
use App\Domains\Document\Models\Document;
use App\Domains\Laboratory\Models\BarcodeGroup;
use App\Domains\Laboratory\Models\ReportTemplate;
use App\Domains\Laboratory\Models\SampleType;
use App\Domains\Laboratory\Models\Section;
use App\Domains\Laboratory\Models\SectionGroup;
use App\Domains\Laboratory\Models\Test;
use App\Domains\Laboratory\Models\TestGroup;
use App\Domains\Laboratory\Models\Workflow;
use App\Domains\Laboratory\Policies\BarcodeGroupPolicy;
use App\Domains\Laboratory\Policies\ReportTemplatePolicy;
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
use App\Domains\Referrer\Models\Referrer;
use App\Domains\User\Models\Role;
use App\Domains\User\Models\User;
use App\Domains\User\Policies\RolePolicy;
use App\Domains\User\Policies\UserPolicy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\Relation;
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
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {

        DB::listen(function ($query) {
            if ($query->time > 1000) {
                Log::warning('🚨 Slow Query Detected: ' . $query->sql, [
                    'bindings' => $query->bindings,
                    'time' => $query->time
                ]);
            }
        });

        Vite::prefetch(concurrency: 3);

        Model::preventLazyLoading();

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
        ]);

        Gate::policy(User::class, UserPolicy::class);
        Gate::policy(Role::class, RolePolicy::class);
        Gate::policy(Patient::class, PatientPolicy::class);
        Gate::policy(SectionGroup::class, SectionGroupPolicy::class);
        Gate::policy(Section::class, SectionPolicy::class);
        Gate::policy(Workflow::class, WorkflowPolicy::class);
        Gate::policy(SampleType::class, SampleTypePolicy::class);
        Gate::policy(BarcodeGroup::class, BarcodeGroupPolicy::class);
        Gate::policy(TestGroup::class, TestGroupPolicy::class);
        Gate::policy(ReportTemplate::class, ReportTemplatePolicy::class);
        Gate::policy(Test::class, TestPolicy::class);
        Gate::policy(Acceptance::class, AcceptancePolicy::class);
        Gate::policy(Invoice::class, InvoicePolicy::class);
        Gate::policy(Sample::class, SamplePolicy::class);
        Gate::policy(Report::class, ReportPolicy::class);
        Gate::policy(Consultation::class, ConsultationPolicy::class);
        Gate::policy(Consultant::class, ConsultantPolicy::class);
    }
}
