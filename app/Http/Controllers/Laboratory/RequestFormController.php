<?php

namespace App\Http\Controllers\Laboratory;

use App\Domains\Laboratory\Models\RequestForm;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRequestFormRequest;
use App\Http\Requests\UpdateRequestFormRequest;

class RequestFormController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreRequestFormRequest $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(RequestForm $requestForm)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateRequestFormRequest $request, RequestForm $requestForm)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(RequestForm $requestForm)
    {
        //
    }
}
