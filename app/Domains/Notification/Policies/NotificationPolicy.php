<?php

namespace App\Domains\Notification\Policies;

use App\Domains\User\Models\User;

class NotificationPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('Notification.Notifications.List Notifications');
    }

    public function manageWhatsapp(User $user): bool
    {
        return $user->can('Notification.WhatsApp.Manage Messages');
    }
}
