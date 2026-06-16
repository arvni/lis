<?php

namespace Tests\Feature\Laboratory;

use App\Domains\Document\Models\Document;
use App\Domains\Laboratory\DTOs\ConsentFormDTO;
use App\Domains\Laboratory\Events\ConsentFormDocumentUpdateEvent;
use App\Domains\Laboratory\Models\ConsentForm;
use App\Domains\Laboratory\Repositories\ConsentFormRepository;
use App\Domains\Laboratory\Services\ConsentFormService;
use Exception;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Event;
use Mockery;
use Tests\TestCase;

class ConsentFormServiceTest extends TestCase
{
    private ConsentFormRepository $repo;
    private ConsentFormService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repo = Mockery::mock(ConsentFormRepository::class);
        $this->service = new ConsentFormService($this->repo);
    }

    private function dto(array $document = []): ConsentFormDTO
    {
        $dto = Mockery::mock(ConsentFormDTO::class);
        $dto->shouldReceive('toArray')->andReturn(['title' => 'Consent']);
        $dto->document = $document;
        return $dto;
    }

    private function formWithTests(bool $hasTests): ConsentForm
    {
        $testsRel = Mockery::mock(\Illuminate\Database\Eloquent\Relations\HasMany::class);
        $testsRel->shouldReceive('exists')->andReturn($hasTests);
        $docsRel = Mockery::mock(\Illuminate\Database\Eloquent\Relations\MorphMany::class);
        $docsRel->shouldReceive('delete')->andReturn(1);

        $form = Mockery::mock(ConsentForm::class)->makePartial();
        $form->shouldReceive('tests')->andReturn($testsRel);
        $form->shouldReceive('documents')->andReturn($docsRel);
        return $form;
    }

    public function test_list_delegates(): void
    {
        $paginator = new LengthAwarePaginator([], 0, 10);
        $this->repo->shouldReceive('ListConsentForms')->once()->andReturn($paginator);
        $this->assertSame($paginator, $this->service->listConsentForms([]));
    }

    public function test_store_persists_without_document_field(): void
    {
        Event::fake([ConsentFormDocumentUpdateEvent::class]);
        $form = new ConsentForm();
        $this->repo->shouldReceive('creatConsentForm')->once()->with(['title' => 'Consent'])->andReturn($form);

        $this->assertSame($form, $this->service->storeConsentForm($this->dto()));
        Event::assertNotDispatched(ConsentFormDocumentUpdateEvent::class);
    }

    public function test_store_dispatches_event_when_document_present(): void
    {
        Event::fake([ConsentFormDocumentUpdateEvent::class]);
        $form = new ConsentForm(['id' => 1]);
        $form->id = 1;
        $this->repo->shouldReceive('creatConsentForm')->once()->andReturn($form);

        $this->service->storeConsentForm($this->dto(['id' => 99]));
        Event::assertDispatched(ConsentFormDocumentUpdateEvent::class);
    }

    public function test_update_delegates(): void
    {
        Event::fake([ConsentFormDocumentUpdateEvent::class]);
        $form = new ConsentForm();
        $this->repo->shouldReceive('updateConsentForm')->once()->with($form, ['title' => 'Consent'])->andReturn($form);

        $this->assertSame($form, $this->service->updateConsentForm($form, $this->dto()));
    }

    public function test_get_document_returns_loaded_document(): void
    {
        $doc = new Document();
        $form = Mockery::mock(ConsentForm::class)->makePartial();
        $form->shouldReceive('load')->once()->with('document')->andReturnSelf();
        $form->document = $doc;

        $this->assertSame($doc, $this->service->getDocument($form));
    }

    public function test_delete_removes_form_without_tests(): void
    {
        $form = $this->formWithTests(false);
        $this->repo->shouldReceive('deleteConsentForm')->once()->with($form)->andReturnNull();
        $this->service->deleteConsentForm($form);
        $this->assertTrue(true);
    }

    public function test_delete_throws_when_form_has_tests(): void
    {
        $form = $this->formWithTests(true);
        $this->repo->shouldNotReceive('deleteConsentForm');
        $this->expectException(Exception::class);
        $this->service->deleteConsentForm($form);
    }
}
