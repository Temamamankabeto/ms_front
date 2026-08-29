<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Notification;
use App\Notifications\ApplicationStatusNotification;

class ApplicationNotificationService
{
    public function send(
        User $user,
        string $title,
        string $message
    ) {
        Notification::send(
            $user,
            new ApplicationStatusNotification(
                $title,
                $message
            )
        );
    }
}
