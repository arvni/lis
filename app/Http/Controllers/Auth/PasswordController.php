<?php

namespace App\Http\Controllers\Auth;

use App\Domains\User\Models\User;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class PasswordController extends Controller
{
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
        if (!$request->input("userId"))
            $request->user()->update([
                'password' => Hash::make($validated['password']),
            ]);
        else
            User::where('id', $validated['userId'])->update([
                'password' => Hash::make($validated['password']),
            ]);

        return back();
    }
}
