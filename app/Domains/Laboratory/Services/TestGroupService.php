<?php

namespace App\Domains\Laboratory\Services;


use App\Domains\Laboratory\DTOs\TestGroupDTO;
use App\Domains\Laboratory\Models\TestGroup;
use App\Domains\Laboratory\Repositories\TestGroupRepository;
use Exception;

class TestGroupService
{
    public function __construct(private TestGroupRepository $testGroupRepository)
    {
    }

    public function listTestGroups($queryData)
    {
        return $this->testGroupRepository->ListTestGroups($queryData);
    }

    public function storeTestGroup(TestGroupDTO $testGroupDTO)
    {
        return $this->testGroupRepository->creatTestGroup($testGroupDTO->toArray());
    }

    public function updateTestGroup(TestGroup $testGroup, TestGroupDTO $testGroupDTO): TestGroup
    {
        return $this->testGroupRepository->updateTestGroup($testGroup, $testGroupDTO->toArray());
    }

    /**
     * @throws Exception
     */
    public function deleteTestGroup(TestGroup $testGroup): void
    {
        if (!$testGroup->tests()->exists()) {
            $this->testGroupRepository->deleteTestGroup($testGroup);
        } else
            throw new Exception("This test group has some Methods");
    }
}
