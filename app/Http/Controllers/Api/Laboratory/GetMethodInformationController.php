<?php

namespace App\Http\Controllers\Api\Laboratory;

use App\Domains\Laboratory\Resources\MethodResource;
use App\Domains\Laboratory\Services\MethodService;
use App\Http\Controllers\Controller;


class GetMethodInformationController extends Controller
{
    public function __construct(private readonly MethodService $methodService)
    {
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke($id)
    {
        $method = $this->methodService->findMethodById($id);
        return new MethodResource($method);
    }
}
