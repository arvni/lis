<?php

namespace App\Http\Controllers;

use App\Domains\User\Models\User;
use App\Domains\User\Services\UserService;
use App\Http\Resources\ListResource;
use Illuminate\Http\Request;

class ListUsersController extends Controller
{
    public function __construct(private readonly UserService $userService)
    {
        $this->middleware("indexProvider");
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        $this->authorize("viewAny", User::class);

        $users = $this->userService->listUsers($request->all());
        return ListResource::collection($users);
    }
}
