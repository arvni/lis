<?php

namespace App\Domains\User\Enums;

use Kongulov\Traits\InteractWithEnum;

enum ActivityType: string
{
    use InteractWithEnum;

    case CREATE = "Create";
    case UPDATE = "Update";
    case DELETE = "Delete";
    case LOGIN = "Login";
    case LOGOUT = "Logout";

}
