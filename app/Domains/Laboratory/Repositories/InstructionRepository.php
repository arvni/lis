<?php

declare(strict_types=1);

namespace App\Domains\Laboratory\Repositories;

use Illuminate\Database\Eloquent\Builder;

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

    /**
     * @param  \Illuminate\Database\Eloquent\Builder<\App\Domains\Laboratory\Models\Instruction>  $query
     */
    protected function applyFilters(Builder $query, array $filters): void
    {
        if (isset($filters["search"]))
            $query->search(["name"], $filters["search"]);
        // scopeActive ignores arguments (always filters is_active = true)
        if (isset($filters["active"]))
            $query->active();
    }

}
