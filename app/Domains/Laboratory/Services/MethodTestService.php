<?php

namespace App\Domains\Laboratory\Services;


use App\Domains\Laboratory\DTOs\MethodTestDTO;
use App\Domains\Laboratory\Models\MethodTest;
use App\Domains\Laboratory\Repositories\MethodTestRepository;
use Exception;

class MethodTestService
{
    public function __construct(private MethodTestRepository $methodTestRepository)
    {
    }

    public function storeMethodTest(MethodTestDTO $methodTestDTO): MethodTest
    {
        return $this->methodTestRepository->creatMethodTest($methodTestDTO->toArray());
    }

    public function updateMethodTest(MethodTest $methodTest, MethodTestDTO $methodTestDTO): MethodTest
    {
        return $this->methodTestRepository->updateMethodTest($methodTest, $methodTestDTO->toArray());
    }

    public function findMethodTestById($id): ?MethodTest
    {
        return $this->methodTestRepository->findMethodTestById($id);
    }
    public function deleteMethodTest(MethodTest $methodTest): void
    {
        $this->methodTestRepository->deleteMethodTest($methodTest);
    }

}
