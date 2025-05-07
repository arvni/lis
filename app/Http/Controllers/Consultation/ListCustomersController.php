<?php

namespace App\Http\Controllers\Consultation;

use App\Domains\Consultation\Services\CustomerService;
use App\Http\Controllers\Controller;
use App\Http\Resources\CustomerResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ListCustomersController extends Controller
{
    public function __construct(private readonly CustomerService $customerService)
    {
        $this->middleware("indexProvider:name");
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): AnonymousResourceCollection
    {
        $queryData = $request->all();
        $doctors = $this->customerService->listCustomers($queryData);
        return CustomerResource::collection($doctors);
    }
}
