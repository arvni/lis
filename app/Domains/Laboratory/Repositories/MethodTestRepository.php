<?php

namespace App\Domains\Laboratory\Repositories;

use App\Domains\Laboratory\Models\MethodTest;
use App\Domains\User\Enums\ActivityType;
use App\Domains\User\Services\UserActivityService;

class MethodTestRepository
{
    public function createMethodTest(array $methodTestData): MethodTest
    {
        $methodTest= MethodTest::create($methodTestData);
        UserActivityService::createUserActivity($methodTest,ActivityType::CREATE);
        return $methodTest;
    }

    public function updateMethodTest(MethodTest $methodTest, array $methodTestData): MethodTest
    {
        $methodTest->fill($methodTestData);
        if ($methodTest->isDirty()) {
            $methodTest->save();
            UserActivityService::createUserActivity($methodTest,ActivityType::UPDATE);
        }
        return $methodTest;
    }

    public function deleteMethodTest(MethodTest $methodTest): void
    {
        $methodTest->delete();
        UserActivityService::createUserActivity($methodTest,ActivityType::DELETE);
    }

    public function findMethodTestById($id): ?MethodTest
    {
        return MethodTest::find($id);
    }

}
