<?php

declare(strict_types=1);

namespace Tests\Feature\Document;

use App\Domains\Document\Enums\DocumentTag;
use App\Domains\Document\Models\Document;
use App\Domains\Document\Repositories\DocumentRepository;
use App\Domains\Document\Services\DocumentService;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * Pins DocumentService::batchUpdate (quality-audit item 3): the batch flow
 * moved out of UpdateBatchDocumentsController fetches all documents in one
 * query, applies the TEMP/untagged → batch-tag fallback, and rolls back
 * atomically when one update fails.
 */
class DocumentBatchUpdateTest extends TestCase
{
    use RefreshDatabase;

    private const PERMISSION = 'Document.Documents.Edit Document';

    private DocumentService $service;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
        $this->actingAs($this->userWithPermission());
        $this->service = new DocumentService(new DocumentRepository);
    }

    private function userWithPermission(): User
    {
        $user = User::factory()->create();
        Permission::findOrCreate(self::PERMISSION);
        $user->givePermissionTo(self::PERMISSION);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $user;
    }

    private function storeDocument(string $tag = 'TEMP'): Document
    {
        return $this->service->storeDocument(
            'user',
            1,
            UploadedFile::fake()->create('file.pdf', 10),
            $tag,
        );
    }

    public function test_batch_update_reassigns_owner_and_applies_tag_fallback(): void
    {
        $tempDocument = $this->storeDocument();
        $taggedDocument = $this->storeDocument(DocumentTag::PRESCRIPTION->value);

        $this->service->batchUpdate(
            [
                ['id' => $tempDocument->hash],
                ['id' => $taggedDocument->hash, 'tag' => DocumentTag::PRESCRIPTION->value],
            ],
            7,
            'patient',
            'acceptance',
            3,
            DocumentTag::DOCUMENT->value,
        );

        // TEMP/untagged documents take the batch tag; others keep their own.
        $this->assertDatabaseHas('documents', [
            'hash' => $tempDocument->hash,
            'owner_id' => 7,
            'owner_type' => 'patient',
            'related_type' => 'acceptance',
            'related_id' => 3,
            'tag' => DocumentTag::DOCUMENT->value,
        ]);
        $this->assertDatabaseHas('documents', [
            'hash' => $taggedDocument->hash,
            'owner_id' => 7,
            'tag' => DocumentTag::PRESCRIPTION->value,
        ]);

        // The file was moved to the new owner's address.
        Storage::disk('local')->assertExists($tempDocument->fresh()->path);
    }

    public function test_batch_update_fetches_all_documents_in_a_single_query(): void
    {
        $documents = [$this->storeDocument(), $this->storeDocument(), $this->storeDocument()];

        $selects = 0;
        DB::listen(function ($query) use (&$selects): void {
            if (str_starts_with(strtolower(trim($query->sql)), 'select') && str_contains($query->sql, 'documents')) {
                $selects++;
            }
        });

        $this->service->batchUpdate(
            array_map(fn (Document $document) => ['id' => $document->hash], $documents),
            7,
            'patient',
            null,
            null,
            DocumentTag::DOCUMENT->value,
        );

        $this->assertSame(1, $selects);
    }

    public function test_batch_update_rolls_back_all_writes_when_one_update_fails(): void
    {
        $first = $this->storeDocument();
        $second = $this->storeDocument();

        Document::saving(function (Document $document) use ($second): void {
            if ($document->hash === $second->hash) {
                throw new RuntimeException('simulated write failure');
            }
        });

        try {
            $this->service->batchUpdate(
                [['id' => $first->hash], ['id' => $second->hash]],
                7,
                'patient',
                null,
                null,
                DocumentTag::DOCUMENT->value,
            );
            $this->fail('Expected the batch update to throw.');
        } catch (RuntimeException) {
            // expected
        }

        // The first document's already-applied update was rolled back.
        $this->assertDatabaseHas('documents', [
            'hash' => $first->hash,
            'owner_id' => 1,
            'owner_type' => 'user',
            'tag' => DocumentTag::TEMP->value,
        ]);
    }

    public function test_endpoint_updates_documents_and_redirects_back(): void
    {
        $document = $this->storeDocument();

        $response = $this->put(route('documents.batchUpdate'), [
            'documents' => [['id' => $document->hash, 'tag' => DocumentTag::TEMP->value]],
            'ownerId' => 9,
            'ownerClass' => 'patient',
            'relatedId' => 4,
            'relatedClass' => 'acceptance',
            'tag' => DocumentTag::MEDICAL_HISTORY->value,
        ]);

        $response->assertRedirect()->assertSessionHas('success', true);
        $this->assertDatabaseHas('documents', [
            'hash' => $document->hash,
            'owner_id' => 9,
            'owner_type' => 'patient',
            'related_type' => 'acceptance',
            'related_id' => 4,
            'tag' => DocumentTag::MEDICAL_HISTORY->value,
        ]);
    }

    public function test_endpoint_rejects_users_without_permission(): void
    {
        $this->actingAs(User::factory()->create());
        $document = $this->storeDocument();

        $this->put(route('documents.batchUpdate'), [
            'documents' => [['id' => $document->hash]],
            'ownerId' => 9,
            'ownerClass' => 'patient',
        ])->assertForbidden();
    }
}
