<?php

namespace App\Observers;

use App\Models\ServiceApplication;

class ServiceApplicationObserver
{
    public function updated(ServiceApplication $application)
    {
        if (!$application->isDirty('status')) {
            return;
        }

        $queue = $application->queue;

        if (!$queue) {
            return;
        }

        $status = $application->status;

        $queueStatus = match ($status) {

            'submitted' => 'waiting',

            'accepted', 'in_progress' => 'serving',

            'approved', 'completed', 'rejected' => 'completed',

            default => 'waiting',
        };

        $queue->update([
            'status' => $queueStatus,
        ]);
    }
}