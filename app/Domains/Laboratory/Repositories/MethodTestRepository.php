<?php

namespace App\Domains\Laboratory\Repositories;

use App\Domains\Shared\Traits\LogsUserActivity;
use App\Domains\Laboratory\Models\MethodTest;

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

}
