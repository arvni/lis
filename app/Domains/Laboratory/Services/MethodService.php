<?php

namespace App\Domains\Laboratory\Services;


use App\Domains\Laboratory\DTOs\MethodDTO;
use App\Domains\Laboratory\Models\Method;
use App\Domains\Laboratory\Repositories\MethodRepository;
use Exception;

class MethodService
{
    public function __construct(private MethodRepository $methodRepository)
    {
    }

    public function storeMethod(MethodDTO $methodDTO): Method
    {
        return $this->methodRepository->creatMethod($methodDTO->toArray());
    }

    public function updateMethod(Method $method, MethodDTO $methodDTO): Method
    {
        return $this->methodRepository->updateMethod($method, $methodDTO->toArray());
    }

    public function findMethodById($id): ?Method
    {
        return $this->methodRepository->findMethodById($id);
    }
    public function deleteMethod(Method $method): void
    {
        $this->methodRepository->deleteMethod($method);
    }

}
