<?php

namespace App\Services;

use App\Models\ServiceApplication;

class ApplicationReportService
{
    public function summary()
    {
        return [
            'total' => ServiceApplication::count(),
            'pending' => ServiceApplication::whereIn('status', [
                'submitted',
                'under_review',
            ])->count(),
            'approved' => ServiceApplication::where('status', 'approved')->count(),
            'rejected' => ServiceApplication::where('status', 'rejected')->count(),
            'completed' => ServiceApplication::where('status', 'completed')->count(),
        ];
    }
}
