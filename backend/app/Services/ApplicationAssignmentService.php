<?php

namespace App\Services;

use App\Models\ApplicationAssignment;
use App\Models\ServiceApplication;
use Illuminate\Support\Facades\Auth;

class ApplicationAssignmentService
{
    public function assign(
        ServiceApplication $application,
        int $officerId
    ) {
        $application->update([
            'current_officer_id' => $officerId,
            'status' => 'under_review',
        ]);

        return ApplicationAssignment::create([
            'application_id' => $application->id,
            'assigned_from' => Auth::id(),
            'assigned_to' => $officerId,
            'assigned_at' => now(),
        ]);
    }
}
