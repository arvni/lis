<?php

declare(strict_types=1);

namespace Tests\Feature\Inventory;

use App\Domains\Inventory\Models\PurchaseRequest;
use App\Domains\Inventory\Models\StockExportRequest;
use App\Domains\Inventory\Models\Store;
use App\Domains\Inventory\Models\WorkflowTemplate;
use App\Domains\Inventory\Services\WorkflowTemplateService;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WorkflowTemplateServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_unused_template_is_deleted(): void
    {
        $template = WorkflowTemplate::create(['name' => 'Unused']);

        $this->assertTrue(app(WorkflowTemplateService::class)->deleteIfUnused($template));
        $this->assertModelMissing($template);
    }

    public function test_template_used_by_a_purchase_request_is_kept(): void
    {
        $template = WorkflowTemplate::create(['name' => 'Purchase Flow']);
        PurchaseRequest::create([
            'requested_by_user_id' => User::factory()->create()->id,
            'urgency' => 'NORMAL',
            'workflow_template_id' => $template->id,
        ]);

        $this->assertFalse(app(WorkflowTemplateService::class)->deleteIfUnused($template));
        $this->assertModelExists($template);
    }

    public function test_template_used_only_by_an_export_request_is_kept(): void
    {
        $template = WorkflowTemplate::create(['name' => 'Export Flow']);
        $store = Store::create(['name' => 'Main Store', 'code' => 'MST', 'is_active' => true]);
        StockExportRequest::create([
            'requested_by_user_id' => User::factory()->create()->id,
            'store_id' => $store->id,
            'destination' => 'Molecular Lab',
            'urgency' => 'NORMAL',
            'workflow_template_id' => $template->id,
        ]);

        $this->assertFalse(app(WorkflowTemplateService::class)->deleteIfUnused($template));
        $this->assertModelExists($template);
    }
}
