<?php

namespace Tests\Feature\Laboratory;

use App\Domains\Laboratory\DTOs\RequestFormDTO;
use App\Domains\Laboratory\Events\RequestFormDocumentUpdateEvent;
use App\Domains\Laboratory\Models\RequestForm;
use App\Domains\Laboratory\Repositories\RequestFormRepository;
use App\Domains\Laboratory\Services\RequestFormService;
use Exception;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Event;
use Mockery;
use Tests\TestCase;

class RequestFormServiceTest extends TestCase
{
    private RequestFormRepository $repo;
    private RequestFormService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repo = Mockery::mock(RequestFormRepository::class);
        $this->service = new RequestFormService($this->repo);
    }

    private function dto(?array $document = null): RequestFormDTO
    {
        $dto = Mockery::mock(RequestFormDTO::class);
        $dto->shouldReceive('toArray')->andReturn(['title' => 'Req']);
        $dto->document = $document;
        return $dto;
    }

    private function formWithTests(bool $hasTests): RequestForm
    {
        $testsRel = Mockery::mock();
        $testsRel->shouldReceive('exists')->andReturn($hasTests);
        $form = Mockery::mock(RequestForm::class)->makePartial();
        $form->shouldReceive('tests')->andReturn($testsRel);
        return $form;
    }

    public function test_list_delegates(): void
    {
        $paginator = new LengthAwarePaginator([], 0, 10);
        $this->repo->shouldReceive('ListRequestForms')->once()->andReturn($paginator);
        $this->assertSame($paginator, $this->service->listRequestForms([]));
    }

    public function test_store_persists_and_dispatches_event_when_document_present(): void
    {
        Event::fake([RequestFormDocumentUpdateEvent::class]);
        $form = new RequestForm();
        $form->id = 1;
        $this->repo->shouldReceive('creatRequestForm')->once()->with(['title' => 'Req'])->andReturn($form);

        $this->service->storeRequestForm($this->dto(['id' => 5]));
        Event::assertDispatched(RequestFormDocumentUpdateEvent::class);
    }

    public function test_store_skips_event_without_document(): void
    {
        Event::fake([RequestFormDocumentUpdateEvent::class]);
        $form = new RequestForm();
        $this->repo->shouldReceive('creatRequestForm')->once()->andReturn($form);

        $this->assertSame($form, $this->service->storeRequestForm($this->dto()));
        Event::assertNotDispatched(RequestFormDocumentUpdateEvent::class);
    }

    public function test_update_delegates(): void
    {
        Event::fake([RequestFormDocumentUpdateEvent::class]);
        $form = new RequestForm();
        $updated = new RequestForm();
        $this->repo->shouldReceive('updateRequestForm')->once()->with($form, ['title' => 'Req'])->andReturn($updated);

        $this->assertSame($updated, $this->service->updateRequestForm($form, $this->dto()));
    }

    public function test_get_by_id_delegates(): void
    {
        $form = new RequestForm();
        $this->repo->shouldReceive('getRequestFormById')->once()->with(8)->andReturn($form);
        $this->assertSame($form, $this->service->getRequestFormById(8));
    }

    public function test_delete_removes_form_without_tests(): void
    {
        $form = $this->formWithTests(false);
        $this->repo->shouldReceive('deleteRequestForm')->once()->with($form)->andReturnNull();
        $this->service->deleteRequestForm($form);
        $this->assertTrue(true);
    }

    public function test_delete_throws_when_form_has_tests(): void
    {
        $form = $this->formWithTests(true);
        $this->repo->shouldNotReceive('deleteRequestForm');
        $this->expectException(Exception::class);
        $this->service->deleteRequestForm($form);
    }
}
