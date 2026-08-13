<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Authentication Language Lines
    |--------------------------------------------------------------------------
    |
    | Laravel ships English defaults for `failed`, `password` and `throttle`,
    | but publishing this file overrides the whole `auth` namespace — so they
    | are repeated here verbatim. `disabled` is this app's own key
    | (App\Domains\Auth\Services\AuthService) and has no framework default; it
    | rendered as the literal string "auth.disabled" until this file existed.
    |
    */

    'failed' => 'These credentials do not match our records.',
    'password' => 'The provided password is incorrect.',
    'throttle' => 'Too many login attempts. Please try again in :seconds seconds.',
    'disabled' => 'This account has been deactivated. Please contact your administrator.',

];
