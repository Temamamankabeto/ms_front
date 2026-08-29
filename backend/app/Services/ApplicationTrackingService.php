<?php

namespace App\Services;

use App\Models\ServiceApplication;

class ApplicationTrackingService
{
    public function track(string $trackingNumber)
    {
        return ServiceApplication::with([
            'service',
            'customer',
            'city',
            'subcity',
            'woreda',
            'currentWindow',
            'currentOfficer',
            'assignee',
            'data',
            'files.uploader',
            'appointments.scheduler',
            'workflow.window',
            'workflow.officer',
            'histories.actor',
            'histories.sender',
            'histories.receiver',
            'histories.fromWindow',
            'histories.toWindow',
            'shares.sharedFromOfficer',
            'shares.sharedToOfficer',
            'shares.fromWindow',
            'shares.toWindow',
        ])
            ->where('tracking_number', $trackingNumber)
            ->first();
    }
}
