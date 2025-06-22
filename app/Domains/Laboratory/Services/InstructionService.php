<?php

namespace App\Domains\Laboratory\Services;


use App\Domains\Document\Enums\DocumentTag;
use App\Domains\Document\Models\Document;
use App\Domains\Laboratory\DTOs\InstructionDTO;
use App\Domains\Laboratory\Events\InstructionDocumentUpdateEvent;
use App\Domains\Laboratory\Models\Instruction;
use App\Domains\Laboratory\Repositories\InstructionRepository;
use Exception;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;

readonly class InstructionService
{
    public function __construct(
        private InstructionRepository          $instructionRepository,
    )
    {
    }

    public function listInstructions($queryData): LengthAwarePaginator
    {
        return $this->instructionRepository->ListInstructions($queryData);
    }

    public function storeInstruction(InstructionDTO $instructionDTO): Instruction
    {
        $instruction = $this->instructionRepository->creatInstruction(Arr::except($instructionDTO->toArray(), ["document"]));
        $this->handleDocumentUpdate($instruction, $instructionDTO);
        return $instruction;
    }

    public function getDocument(Instruction $instruction): ?Document
    {
        $instruction->load("document");

        return $instruction->document;
    }


    public function updateInstruction(Instruction $instruction, InstructionDTO $instructionDTO): Instruction
    {
        $this->instructionRepository->updateInstruction($instruction, Arr::except($instructionDTO->toArray(), ["document"]));
        $this->handleDocumentUpdate($instruction, $instructionDTO);
        return $instruction;
    }

    /**
     * @throws Exception
     */
    public function deleteInstruction(Instruction $instruction): void
    {
        if (!$instruction->tests()->exists()) {
            $instruction->documents()->delete();
            $this->instructionRepository->deleteInstruction($instruction);
        } else
            throw new Exception("This Report template group has some tests");
    }

    private function handleDocumentUpdate(Instruction $instruction, InstructionDTO $instructionDTO): void
    {
        if (isset($instructionDTO->document['id']))
            InstructionDocumentUpdateEvent::dispatch($instructionDTO->document['id'], $instruction->id, DocumentTag::DOCUMENT->value);
    }
}
