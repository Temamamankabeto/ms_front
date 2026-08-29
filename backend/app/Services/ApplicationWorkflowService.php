<?php

namespace App\Services;

use App\Models\ServiceApplication;
use App\Models\ServiceApplicationHistory;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ApplicationWorkflowService
{
    public function approve(ServiceApplication $application): ServiceApplication
    {
        return $this->changeStatus($application, 'approved', 'Application approved');
    }

    public function reject(ServiceApplication $application, ?string $reason = null): ServiceApplication
    {
        return $this->changeStatus($application, 'rejected', $reason ?? 'Application rejected');
    }

    public function returnForCorrection(ServiceApplication $application, ?string $reason = null): ServiceApplication
    {
        return $this->changeStatus($application, 'returned', $reason ?? 'Returned for correction');
    }

    public function complete(ServiceApplication $application): ServiceApplication
    {
        return $this->changeStatus($application, 'completed', 'Application completed');
    }

    protected function changeStatus(ServiceApplication $application, string $status, string $note): ServiceApplication
    {
        return DB::transaction(function () use ($application, $status, $note) {
            $oldStatus = $application->status;

            $application->update([
                'status' => $status,
                'current_stage' => $status,
                'approved_at' => $status === 'approved' ? now() : $application->approved_at,
                'rejected_at' => $status === 'rejected' ? now() : $application->rejected_at,
                'completed_at' => $status === 'completed' ? now() : $application->completed_at,
                'rejection_reason' => $status === 'rejected' ? $note : $application->rejection_reason,
            ]);

            ServiceApplicationHistory::create([
                'application_id' => $application->id,
                'from_status' => $oldStatus,
                'to_status' => $status,
                'action' => $status,
                'action_type' => 'workflow',
                'remark' => $note,
                'actor_id' => Auth::id(),
            ]);

            return $application->fresh();
        });
    }
}
