<?php

namespace App\Domains\Laboratory\Repositories;

use App\Domains\Laboratory\Models\MethodTest;

class MethodTestRepository
{
    public function createMethodTest(array $methodTestData): MethodTest
    {
        return MethodTest::create($methodTestData);
    }

    public function updateMethodTest(MethodTest $methodTest, array $methodTestData): MethodTest
    {
        $methodTest->fill($methodTestData);
        if ($methodTest->isDirty())
            $methodTest->save();
        return $methodTest;
    }

    public function deleteMethodTest(MethodTest $methodTest): void
    {
        $methodTest->delete();
    }

    public function findMethodTestById($id): ?MethodTest
    {
        return MethodTest::find($id);
    }

}
