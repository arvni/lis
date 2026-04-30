<?php

namespace App\Domains\Laboratory\Repositories;

use App\Domains\Shared\Traits\LogsUserActivity;
use App\Domains\Laboratory\Models\Instruction;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class InstructionRepository
{
    use LogsUserActivity;


    public function listInstructions(array $queryData): LengthAwarePaginator
    {
        $query = Instruction::with("document")->withCount(["tests"]);
        if (isset($queryData["filters"]))
            $this->applyFilters($query, $queryData["filters"]);
        if (isset($queryData["sort"]))
            $query->orderBy($queryData['sort']['field'] ?? 'id', $queryData['sort']['sort'] ?? 'asc');
        return $query->paginate($queryData["pageSize"] ?? 10);
    }

    public function creatInstruction(array $instructionData): Instruction
    {
        $instruction= Instruction::query()->create($instructionData);
        $this->logCreated($instruction);
        return $instruction;
    }

    public function updateInstruction(Instruction $instruction, array $instructionData): Instruction
    {
        $instruction->fill($instructionData);
        if ($instruction->isDirty()) {
            $instruction->save();
            $this->logUpdated($instruction);
        }
        return $instruction;
    }

    public function deleteInstruction(Instruction $instruction): void
    {
        $instruction->delete();
        $this->logDeleted($instruction);
    }

    protected function applyFilters($query, array $filters)
    {
        if (isset($filters["search"]))
            $query->search(["name"], $filters["search"]);
        if (isset($filters["active"]))
            $query->active($filters["active"]);
    }

}
