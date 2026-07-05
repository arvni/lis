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
    public function __invoke(User $user): \Illuminate\Http\Resources\Json\JsonResource
    {
        $this->authorize("viewAny", User::class);

        return new UserResource($user);
    }
}
