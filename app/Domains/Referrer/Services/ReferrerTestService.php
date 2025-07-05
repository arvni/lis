<?php

namespace App\Domains\Referrer\Services;

use App\Domains\Referrer\DTOs\ReferrerTestDTO;
use App\Domains\Referrer\Models\Referrer;
use App\Domains\Referrer\Models\ReferrerTest;
use App\Domains\Referrer\Repositories\ReferrerTestRepository;
use Exception;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ReferrerTestService
{
    public function __construct(private ReferrerTestRepository $referrerTestRepository)
    {
    }

    /**
     * @throws Exception
     */
    public function index(array $queryData = []): LengthAwarePaginator
    {
        try {
            return $this->referrerTestRepository->index($queryData);
        } catch (Exception $e) {
            Log::error('Error fetching tests: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * @throws Exception
     */
    public function findById(int $id): ?ReferrerTest
    {
            return $this->referrerTestRepository->findById($id);
    }

    /**
     * @throws Exception
     */
    public function store(ReferrerTestDTO $dto): ReferrerTest
    {
        try {
            // Add any additional business logic before storing
            return $this->referrerTestRepository->store($dto->toArray());
        } catch (Exception $e) {
            Log::error('Error storing test: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * @throws Exception
     */
    public function update(ReferrerTest $referrerTest, ReferrerTestDTO $dto): ReferrerTest
    {
        try {
            // Add any additional business logic before updating
            return $this->referrerTestRepository->update($referrerTest, $dto->toArray());
        } catch (Exception $e) {
            Log::error('Error updating test: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * @throws Exception
     */
    public function delete(ReferrerTest $referrerTest): bool
    {
        try {
            // Add any additional business logic before deleting
            return $this->referrerTestRepository->delete($referrerTest);
        } catch (Exception $e) {
            Log::error('Error deleting test: ' . $e->getMessage());
            throw $e;
        }
    }

    // Additional business logic methods can be added here
    public function calculateConditionalPrice(array $extra): float
    {
        $parameters = collect($extra['parameters'])
            ->keyBy('id')
            ->map(fn($param) => $param['value']);

        $conditions = collect($extra['conditions']);

        // Find the first matching condition
        $matchedCondition = $conditions->first(function ($condition) use ($parameters) {
            // Dynamically evaluate the condition using parameters
            $p1 = $parameters['A7Wmfw'] ?? 0;
            $p2 = $parameters['HZIcwd'] ?? 0;

            try {
                return eval("return {$condition['condition']};");
            } catch (Exception $e) {
                return false;
            }
        });

        // Calculate price based on matched condition
        if ($matchedCondition) {
            try {
                $p1 = $parameters['A7Wmfw'] ?? 0;
                $p2 = $parameters['HZIcwd'] ?? 0;
                return (float)eval("return {$matchedCondition['value']};");
            } catch (Exception $e) {
                return 0;
            }
        }

        return 0;
    }

    public function copyFromOtherReferrer(Referrer $sourceReferrer, Referrer $referrer)
    {
        $sourceReferrer->load("referrerTests");
        $referrer->load("referrerTests");
        foreach ($sourceReferrer->referrerTests as $referrerTest){
            $newReferrerTest= $referrer->referrerTests->where("test_id",$referrerTest->test_id)->first();
            if ($newReferrerTest){
                $this->referrerTestRepository->update($referrerTest,[
                    "price"=>$referrerTest->price,
                    "methods"=>$referrerTest->methods
                ]);
            }else{
                $this->referrerTestRepository->store([
                    "price"=>$referrerTest->price,
                    "methods"=>$referrerTest->methods,
                    "test_id"=>$referrerTest->test_id,
                    "referrer_id"=>$referrer->id
                ]);
            }
        }
    }
}
