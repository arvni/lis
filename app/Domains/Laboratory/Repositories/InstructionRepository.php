<?php

namespace App\Domains\Laboratory\Repositories;

use App\Domains\Laboratory\Models\Instruction;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class InstructionRepository
{

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
        return Instruction::query()->create($instructionData);
    }

    public function updateInstruction(Instruction $instruction, array $instructionData): Instruction
    {
        $instruction->fill($instructionData);
        if ($instruction->isDirty())
            $instruction->save();
        return $instruction;
    }

    public function deleteInstruction(Instruction $instruction): void
    {
        $instruction->delete();
    }

    protected function applyFilters($query, array $filters)
    {
        if (isset($filters["search"]))
            $query->search(["name"], $filters["search"]);
        if (isset($filters["active"]))
            $query->active($filters["active"]);
    }

}
