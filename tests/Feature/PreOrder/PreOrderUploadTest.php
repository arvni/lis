<?php

declare(strict_types=1);

namespace Tests\Feature\PreOrder;

use App\Domains\Document\Models\Document;
use App\Domains\PreOrder\DTOs\RaiseRequestDTO;
use App\Domains\PreOrder\Enums\ActionStatus;
use App\Domains\PreOrder\Models\PreOrderAction;
use App\Domains\PreOrder\Services\PreOrderInbox;
use App\Domains\PreOrder\Support\PreOrderSnapshot;
use App\Domains\User\Models\User;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

/** A center file from api's incoming folder to a document on the pre-order. */
class PreOrderUploadTest extends PreOrderTestCase
{
    private string $incoming;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        $this->incoming = sys_get_temp_dir().'/preorder-incoming-'.Str::random(6);
        mkdir($this->incoming);
        config(['services.preorder_uploads.incoming' => $this->incoming, 'services.clamav.host' => '']);
    }

    protected function tearDown(): void
    {
        array_map('unlink', glob($this->incoming.'/*') ?: []);
        @rmdir($this->incoming);
        parent::tearDown();
    }

    private function upload(int $preOrderId, string $bytes, string $ext, array $payload = []): PreOrderAction
    {
        $file = Str::uuid().'.'.$ext;
        file_put_contents($this->incoming.'/'.$file, $bytes);
        $action = PreOrderAction::create([
            'uuid' => (string) Str::uuid(),
            'referrer_id' => $this->referrerId,
            'pre_order_id' => $preOrderId,
            'type' => 'upload_document',
            'payload' => ['file' => $file, 'name' => 'pedigree.pdf', 'tag' => 'MEDICAL_HISTORY', ...$payload],
            'actor' => ['user_id' => 7, 'name' => 'Center nurse'],
            'status' => ActionStatus::PENDING,
        ]);
        app(PreOrderInbox::class)->processOne($action->id);

        return $action->refresh();
    }

    private function pdf(string $extra = ''): string
    {
        return "%PDF-1.4\n1 0 obj\n<< /Type /Catalog {$extra} >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n";
    }

    public function test_an_accepted_file_becomes_a_document_of_the_pre_order_and_reaches_the_snapshot(): void
    {
        $preOrder = $this->workflow->openReview($this->workflow->submit($this->draft([$this->test('WES', 'exome')]), $this->center()), $this->bion());
        $this->workflow->raiseRequest($preOrder, RaiseRequestDTO::fromArray(['types' => ['information'], 'reason' => 'pedigree', 'message' => 'Please send the pedigree']), $this->bion());

        $action = $this->upload($preOrder->id, $this->pdf(), 'pdf', ['name' => '../../evil<b>.pdf', 'request' => 1]);

        $this->assertSame(ActionStatus::DONE, $action->status, (string) $action->error);
        $document = Document::query()->where('owner_type', 'preorder')->where('owner_id', $preOrder->id)->firstOrFail();
        $this->assertSame('evilb.pdf', $document->originalName, 'path parts and markup characters are stripped');
        $this->assertSame('pdf', $document->ext);
        Storage::disk('local')->assertExists($document->path);
        $this->assertSame([], glob($this->incoming.'/*'), 'the incoming copy is always removed');

        $snapshot = app(PreOrderSnapshot::class)->build($preOrder->refresh());
        $this->assertSame($document->hash, $snapshot['documents'][0]['hash']);
        $this->assertSame(1, collect($snapshot['history'])->firstWhere('type', 'document')['request']);
    }

    public function test_a_refused_file_is_reported_to_the_center_and_removed(): void
    {
        $preOrder = $this->draft([$this->test('NIPT', 'nipt')]);

        $action = $this->upload($preOrder->id, $this->pdf('/OpenAction << /S /JavaScript /JS (x) >>'), 'pdf');

        $this->assertSame(ActionStatus::FAILED, $action->status);
        $this->assertStringContainsString('scripts, attachments or actions', (string) $action->error);
        $this->assertSame(0, Document::query()->where('owner_type', 'preorder')->count());
        $this->assertSame([], glob($this->incoming.'/*'));
        Storage::disk('local')->assertDirectoryEmpty('/');
    }

    public function test_a_file_for_a_request_that_is_not_open_is_refused(): void
    {
        $preOrder = $this->draft([$this->test('NIPT', 'nipt')]);

        $action = $this->upload($preOrder->id, $this->pdf(), 'pdf', ['request' => 4]);

        $this->assertSame('Request R4 is not open.', $action->error);
    }

    public function test_bion_downloads_only_this_pre_orders_files(): void
    {
        $preOrder = $this->draft([$this->test('NIPT', 'nipt')]);
        $this->upload($preOrder->id, $this->pdf(), 'pdf');
        $document = Document::query()->where('owner_type', 'preorder')->firstOrFail();
        $other = $this->draft([$this->test('NIPT-2', 'nipt')]);

        Permission::findOrCreate('PreOrders.Cases.View');
        $viewer = User::factory()->create();
        $viewer->givePermissionTo('PreOrders.Cases.View');
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $this->actingAs($viewer)->get(route('pre-orders.documents.show', [$other, $document->hash]))->assertNotFound();
        $this->actingAs(User::factory()->create())->get(route('pre-orders.documents.show', [$preOrder, $document->hash]))->assertForbidden();
    }
}
