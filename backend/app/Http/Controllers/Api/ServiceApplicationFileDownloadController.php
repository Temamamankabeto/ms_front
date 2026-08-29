<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ServiceApplicationFile;
use App\Support\AppRoles;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ServiceApplicationFileDownloadController extends Controller
{
    public function __invoke(Request $request, ServiceApplicationFile $file)
    {
        $file->loadMissing([
            'application.customer',
            'application.histories',
            'application.shares',
        ]);

        abort_unless($this->canDownload($request, $file), 403, 'You are not allowed to open this document.');
        abort_unless($file->path && Storage::disk('public')->exists($file->path), 404, 'Document not found.');

        return Storage::disk('public')->response(
            $file->path,
            $file->original_name ?: basename($file->path),
            [
                'Content-Type' => $file->mime_type ?: Storage::disk('public')->mimeType($file->path),
                'X-Content-Type-Options' => 'nosniff',
                'Cache-Control' => 'private, max-age=0, no-store',
            ]
        );
    }

    protected function canDownload(Request $request, ServiceApplicationFile $file): bool
    {
        $user = $request->user();

        if (! $user || ! $file->application) {
            return false;
        }

        $application = $file->application;
        $role = AppRoles::normalize($user->roles()->pluck('name')->first());

        if ($role === AppRoles::CUSTOMER) {
            return (int) $application->customer_id === (int) $user->id
                || (int) ($application->created_by ?? 0) === (int) $user->id
                || (int) ($application->user_id ?? 0) === (int) $user->id
                || $application->histories()
                    ->where('actor_id', $user->id)
                    ->whereIn('action', ['submitted', 'resubmitted'])
                    ->exists();
        }

        if (
            $user->can('service_applications.read') ||
            $user->can('service_applications.review') ||
            $user->can('service_applications.update')
        ) {
            if ((int) $application->current_officer_id === (int) $user->id) {
                return true;
            }

            if ((int) $application->assigned_to === (int) $user->id) {
                return true;
            }

            if ($application->histories()
                ->where(function ($query) use ($user) {
                    $query->where('actor_id', $user->id)
                        ->orWhere('sender_id', $user->id)
                        ->orWhere('receiver_id', $user->id);
                })
                ->exists()
            ) {
                return true;
            }

            if ($application->shares()
                ->where(function ($query) use ($user) {
                    $query->where('from_officer_id', $user->id)
                        ->orWhere('to_officer_id', $user->id);
                })
                ->exists()
            ) {
                return true;
            }

            // Admin / manager / scoped users are still protected by route permissions
            // and their application list/detail scope. Allow document access here after
            // permission check so they can open documents from authorized screens.
            return in_array($role, [
                AppRoles::SUPER_ADMIN,
                AppRoles::ADMIN,
                AppRoles::MANAGER,
                AppRoles::FEEDBACK_OFFICER,
                AppRoles::RECORD_OFFICER,
            ], true);
        }

        return false;
    }
}
