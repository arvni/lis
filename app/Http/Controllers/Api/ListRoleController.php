<?php

namespace App\Http\Controllers\Api;

use App\Domains\User\Services\RoleService;
use App\Http\Controllers\Controller;
use App\Http\Resources\ListResource;
use Illuminate\Http\Request;

class ListRoleController extends Controller
{
    public function __construct(protected RoleService $roleService)
    {
    }

    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request)
    {
        $roles= $this->roleService->listRoles(["filters" => ["search"=>$request->get("search")]]);
        return ListResource::collection($roles);
    }
}
