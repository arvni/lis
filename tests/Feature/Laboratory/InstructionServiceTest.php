<?php

namespace Tests\Feature\Laboratory;

use App\Domains\Document\Models\Document;
use App\Domains\Laboratory\DTOs\InstructionDTO;
use App\Domains\Laboratory\Events\InstructionDocumentUpdateEvent;
use App\Domains\Laboratory\Models\Instruction;
use App\Domains\Laboratory\Repositories\InstructionRepository;
use App\Domains\Laboratory\Services\InstructionService;
use Exception;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Event;
use Mockery;
use Tests\TestCase;

class InstructionServiceTest extends TestCase
{
    private InstructionRepository $repo;
    private InstructionService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->repo = Mockery::mock(InstructionRepository::class);
        $this->service = new InstructionService($this->repo);
    }

    private function dto(array $document = []): InstructionDTO
    {
        $dto = Mockery::mock(InstructionDTO::class);
        $dto->shouldReceive('toArray')->andReturn(['title' => 'Instr']);
        $dto->document = $document;
        return $dto;
    }

    private function formWithTests(bool $hasTests): Instruction
    {
        $testsRel = Mockery::mock(HasMany::class);
        $testsRel->shouldReceive('exists')->andReturn($hasTests);
        $docsRel = Mockery::mock(MorphMany::class);
        $docsRel->shouldReceive('delete')->andReturn(1);

        $form = Mockery::mock(Instruction::class)->makePartial();
        $form->shouldReceive('tests')->andReturn($testsRel);
        $form->shouldReceive('documents')->andReturn($docsRel);
        return $form;
    }

    public function test_list_delegates(): void
    {
        $paginator = new LengthAwarePaginator([], 0, 10);
        $this->repo->shouldReceive('ListInstructions')->once()->andReturn($paginator);
        $this->assertSame($paginator, $this->service->listInstructions([]));
    }

    public function test_store_persists_without_document_field(): void
    {
        Event::fake([InstructionDocumentUpdateEvent::class]);
        $form = new Instruction();
        $this->repo->shouldReceive('creatInstruction')->once()->with(['title' => 'Instr'])->andReturn($form);

        $this->assertSame($form, $this->service->storeInstruction($this->dto()));
        Event::assertNotDispatched(InstructionDocumentUpdateEvent::class);
    }

    public function test_store_dispatches_event_when_document_present(): void
    {
        Event::fake([InstructionDocumentUpdateEvent::class]);
        $form = new Instruction();
        $form->id = 1;
        $this->repo->shouldReceive('creatInstruction')->once()->andReturn($form);

        $this->service->storeInstruction($this->dto(['id' => 99]));
        Event::assertDispatched(InstructionDocumentUpdateEvent::class);
    }

    public function test_update_delegates(): void
    {
        Event::fake([InstructionDocumentUpdateEvent::class]);
        $form = new Instruction();
        $this->repo->shouldReceive('updateInstruction')->once()->with($form, ['title' => 'Instr'])->andReturn($form);

        $this->assertSame($form, $this->service->updateInstruction($form, $this->dto()));
    }

    public function test_get_document_returns_loaded_document(): void
    {
        $doc = new Document();
        $form = Mockery::mock(Instruction::class)->makePartial();
        $form->shouldReceive('load')->once()->with('document')->andReturnSelf();
        $form->document = $doc;

        $this->assertSame($doc, $this->service->getDocument($form));
    }

    public function test_delete_removes_form_without_tests(): void
    {
        $form = $this->formWithTests(false);
        $this->repo->shouldReceive('deleteInstruction')->once()->with($form)->andReturnNull();
        $this->service->deleteInstruction($form);
        $this->assertTrue(true);
    }

    public function test_delete_throws_when_form_has_tests(): void
    {
        $form = $this->formWithTests(true);
        $this->repo->shouldNotReceive('deleteInstruction');
        $this->expectException(Exception::class);
        $this->service->deleteInstruction($form);
    }
}
