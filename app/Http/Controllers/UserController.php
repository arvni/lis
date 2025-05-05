<?php

namespace App\Http\Controllers;

use App\Domains\User\DTOs\UserDTO;
use App\Domains\User\Models\User;
use App\Domains\User\Requests\StoreUserRequest;
use App\Domains\User\Requests\UpdateUserRequest;
use App\Domains\User\Services\UserService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function __construct(protected UserService $userService)
    {
        $this->middleware('indexProvider')->only('index');
    }

    public function index(Request $request): Response
    {
        $this->authorize("viewAny", User::class);
        $users = $this->userService->listUsers($request->all());
        return Inertia::render('User/Index', [
            'users' => $users,
            'requestInputs' => $request->all()
        ]);
    }

    public function create(Request $request): Response
    {
        $this->authorize("create", User::class);
        return Inertia::render('User/Add',);
    }

    public function store(StoreUserRequest $request)
    {
        $validated = $request->validated();

        $userDto = new UserDTO(
            $validated['name'],
            $validated['username'],
            $validated['email'],
            $validated["mobile"],
            $validated['password'],
            $validated['signature']?? null,
            $validated["stamp"]?? null,
            $validated['title'],
            $validated['roles']
        );
        $this->userService->createUser($userDto);
        return redirect()->route('users.index')->with('success', 'User created successfully.');
    }

    public function edit(User $user)
    {
        $user->load('roles:id,name');
        $this->authorize("update", $user);
        return Inertia::render('User/Edit', [
            'user' => $user,
        ]);
    }

    public function update(UpdateUserRequest $request, User $user)
    {
        $validated = $request->validated();
        $userDto = new UserDTO(
            $validated['name'],
            $validated['username'],
            $validated['email'],
            $validated["mobile"],
            $validated['password'] ?? null,
            $validated['signature']?? null,
            $validated["stamp"]?? null,
            $validated['title'],
            $validated['roles']
        );
        $this->userService->updateUser($user, $userDto);
        return redirect()->route('users.index')->with('success', 'User updated successfully.');
    }

    public function destroy(User $user)
    {
        $this->authorize("delete", $user);
        $this->userService->deleteUser($user);
        return redirect()->route('users.index')->with('success', 'User deleted successfully.');
    }
}
