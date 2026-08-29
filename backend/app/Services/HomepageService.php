<?php

namespace App\Services;

use App\Models\Announcement;
use App\Models\Service;
use App\Models\User;
use App\Models\Window;

class HomepageService
{
    public function getHomepageData(): array
    {
        return [
            'hero' => [
                'title' => 'Digital Government Services for Adama City',
                'subtitle' => 'Apply, Track, and Manage Government Services Online',
            ],
            'statistics' => [
                'total_services' => Service::count(),
                'active_services' => Service::where('status', 'active')->count(),
                'total_windows' => Window::count(),
                'total_officers' => User::count(),
                'processed_applications' => 0,
            ],
            'featured_services' => Service::where('status', 'active')->latest()->take(6)->get(),
            'announcements' => Announcement::where('status', 'active')->latest()->take(6)->get(['id', 'title', 'description', 'status', 'created_at']),
        ];
    }
}
