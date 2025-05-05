<?php

namespace App\Http\Controllers;

use App\Domains\User\Requests\StoreRoleRequest;
use App\Domains\User\Requests\UpdateRoleRequest;
use App\Domains\User\Models\Role;
use App\Domains\User\Services\RoleService;
use Exception;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RoleController extends Controller
{
    private RoleService $roleService;

    public function __construct(RoleService $roleService)
    {
        $this->roleService = $roleService;
        $this->middleware("indexProvider")->only("index");
    }

    /**
     * Display a listing of the resource.
     * @throws AuthorizationException
     */
    public function index(Request $request): Response
    {
        $this->authorize("viewAny", Role::class);
        $requestInputs = $request->all();
        $roles = $this->roleService->listRoles($requestInputs);
        return Inertia::render('Role/Index', compact("roles", "requestInputs"));
    }

    /**
     * Show the form for creating a new resource.
     * @throws AuthorizationException
     */
    public function create(): Response
    {
        $this->authorize("create", Role::class);
        return Inertia::render('Role/Add', ['permissions' => $this->roleService->preparePermissions()]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreRoleRequest $request): RedirectResponse
    {
        $this->roleService->createRole($request->validated());
        return redirect()->route('roles.index')->with("status", $request["name"] . " Successfully Created.");
    }

    /**
     * Show the form for editing the specified resource.
     * @throws AuthorizationException
     */
    public function edit(Role $role): Response
    {
        $this->authorize("update", $role);

        $role["permissions"] = $role->permissions()->pluck('id');

        return Inertia::render('Role/Edit', [
            "role" => $role,
            "permissions" => $this->roleService->preparePermissions()
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateRoleRequest $request, Role $role): RedirectResponse
    {
        $this->roleService->updateRole($role, $request->validated());
        return redirect()->route('roles.index')->with("status", $request["name"] . " Successfully Updated.");
    }

    /**
     * Remove the specified resource from storage.
     * @throws AuthorizationException
     */
    public function destroy(Role $role): RedirectResponse
    {
        $this->authorize("delete", $role);
        $title = $role["name"];
        try {
            $role->delete();
        } catch (Exception $e) {
            return redirect()->back()->withErrors($e->getMessage());
        }
        return redirect()->back()->with("status", "$title Successfully Deleted.");
    }
}
