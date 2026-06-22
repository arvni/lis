<?php

namespace App\Http\Controllers\Auth;

use App\Domains\User\Repositories\UserRepository;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class PasswordController extends Controller
{
    public function __construct(private UserRepository $users) {}

    /**
     * Update the user's password.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'current_password' => [Rule::excludeIf(fn() => $request->input("userId")), 'required', 'current_password'],
            'userId' => ["nullable", "exists:users,id"],
            'password' => ['required', Password::defaults(), 'confirmed'],
        ]);

        $targetId = $validated['userId'] ?? $request->user()->id;
        $this->users->updatePasswordById((int) $targetId, Hash::make($validated['password']));

        return back();
    }
}
