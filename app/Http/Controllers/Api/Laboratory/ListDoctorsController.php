<?php

namespace App\Http\Controllers\Api\Laboratory;

use App\Domains\Laboratory\Resources\DoctorResource;
use App\Domains\Laboratory\Services\DoctorService;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ListDoctorsController extends Controller
{
    public function __construct(private DoctorService $doctorService)
    {
        $this->middleware("indexProvider:name");
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): AnonymousResourceCollection
    {
        $queryData = $request->all();
        $doctors = $this->doctorService->listDoctors($queryData);
        return DoctorResource::collection($doctors);
    }
}
