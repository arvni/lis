<?php

namespace Tests\Feature\Document;

use App\Domains\Document\Models\Document;
use App\Domains\Document\Services\DocumentService;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Tests\TestCase;

class DocumentServiceTest extends TestCase
{
    use RefreshDatabase;

    private DocumentService $service;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        $this->actingAs(User::factory()->create());
        $this->service = new DocumentService();
    }

    private function store(): Document
    {
        return $this->service->storeDocument(
            'user',
            1,
            UploadedFile::fake()->create('report.pdf', 10),
            'DOCUMENT',
        );
    }

    public function test_store_document_persists_record_and_file(): void
    {
        $document = $this->store();

        $this->assertDatabaseHas('documents', ['hash' => $document->hash, 'tag' => 'DOCUMENT']);
        $this->assertSame('pdf', $document->ext);
        Storage::disk('local')->assertExists($document->path);
    }

    public function test_get_document_finds_by_id(): void
    {
        $document = $this->store();
        $this->assertSame($document->hash, $this->service->getDocument($document->hash)->hash);
        $this->assertNull($this->service->getDocument('missing-hash'));
    }

    public function test_update_document_changes_metadata(): void
    {
        $document = $this->store();

        $updated = $this->service->updateDocument($document, ['tag' => 'AVATAR']);

        $this->assertSame('AVATAR', $updated->tag->value);
        $this->assertDatabaseHas('documents', ['hash' => $document->hash, 'tag' => 'AVATAR']);
    }

    public function test_delete_document_removes_record_and_file(): void
    {
        $document = $this->store();
        $path = $document->path;

        $this->service->deleteDocument($document);

        $this->assertSoftDeleted('documents', ['hash' => $document->hash]);
        Storage::disk('local')->assertMissing($path);
    }

    public function test_show_document_aborts_when_file_missing(): void
    {
        $document = Document::create([
            'owner_type'   => 'user',
            'owner_id'     => 1,
            'hash'         => \Illuminate\Support\Str::uuid(),
            'ext'          => 'pdf',
            'tag'          => 'DOCUMENT',
            'originalName' => 'missing.pdf',
            'path'         => 'nonexistent/missing.pdf',
        ]);

        $this->expectException(NotFoundHttpException::class);
        $this->service->showDocument($document);
    }
}
