<?php

declare(strict_types=1);

namespace App\Domains\Reception\Services;

use App\Domains\Reception\DTOs\TatAlertRuleDTO;
use App\Domains\Reception\Models\TatAlertRule;
use App\Domains\Reception\Repositories\TatAlertRuleRepository;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class TatAlertRuleService
{
    public function __construct(private readonly TatAlertRuleRepository $ruleRepository) {}

    /**
     * @param  array<string, mixed>  $queryData
     * @return LengthAwarePaginator<int, TatAlertRule>
     */
    public function listRules(array $queryData): LengthAwarePaginator
    {
        return $this->ruleRepository->listRules($queryData);
    }

    public function storeRule(TatAlertRuleDTO $dto): TatAlertRule
    {
        return DB::transaction(function () use ($dto) {
            $rule = $this->ruleRepository->createRule($dto->toArray());
            $this->syncRelations($rule, $dto);

            return $rule;
        });
    }

    public function updateRule(TatAlertRule $rule, TatAlertRuleDTO $dto): TatAlertRule
    {
        return DB::transaction(function () use ($rule, $dto) {
            $updated = $this->ruleRepository->updateRule($rule, $dto->toArray());
            $this->syncRelations($updated, $dto);

            return $updated;
        });
    }

    public function deleteRule(TatAlertRule $rule): void
    {
        $this->ruleRepository->deleteRule($rule);
    }

    private function syncRelations(TatAlertRule $rule, TatAlertRuleDTO $dto): void
    {
        $rule->tests()->sync(Arr::pluck($dto->tests, 'id'));
        $rule->users()->sync(Arr::pluck($dto->users, 'id'));
        $rule->roles()->sync(Arr::pluck($dto->roles, 'id'));
    }
}
