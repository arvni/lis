<?php

namespace App\Domains\Laboratory\Repositories;

use App\Domains\Shared\Traits\LogsUserActivity;
use App\Domains\Laboratory\Models\MethodTest;
use Illuminate\Database\Eloquent\Collection;

class MethodTestRepository
{
    use LogsUserActivity;

    public function createMethodTest(array $methodTestData): MethodTest
    {
        $methodTest= MethodTest::create($methodTestData);
        $this->logCreated($methodTest);
        return $methodTest;
    }

    public function updateMethodTest(MethodTest $methodTest, array $methodTestData): MethodTest
    {
        $methodTest->fill($methodTestData);
        if ($methodTest->isDirty()) {
            $methodTest->save();
            $this->logUpdated($methodTest);
        }
        return $methodTest;
    }

    public function deleteMethodTest(MethodTest $methodTest): void
    {
        $methodTest->delete();
        $this->logDeleted($methodTest);
    }

    public function findMethodTestById(int|string $id): ?MethodTest
    {
        return MethodTest::find($id);
    }

    /**
     * A method's default individual MethodTest (used when ejecting items from a panel).
     */
    public function findDefaultMethodTestForMethod(int|string $methodId): ?MethodTest
    {
        return MethodTest::where('method_id', $methodId)
            ->where('is_default', true)
            ->first();
    }

    /**
     * The given MethodTests with their test (+ accepted sample types) and method
     * loaded, for building a panel.
     *
     * @param  array<int, int|string>  $ids
     * @return Collection<int, MethodTest>
     */
    public function getMethodTestsByIdsWithPanelRelations(array $ids): Collection
    {
        return MethodTest::whereIn('id', $ids)
            ->with(['test.sampleTypes', 'method'])
            ->get();
    }

}
