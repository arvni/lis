<?php

namespace App\Http\Controllers;

use App\Domains\User\Models\User;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;

class GetUserDetailsController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(User $user)
    {
        return new UserResource($user);
    }
}
