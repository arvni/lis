<?php

namespace App\Http\Controllers\Consultation;

use App\Domains\User\Models\User;
use App\Http\Controllers\Controller;
use App\Http\Resources\ListResource;
use Illuminate\Http\Request;

class ListConsultantsController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        $users = User::permission('Consultation.Done Consultation')->get();
        return ListResource::collection($users);
    }
}
