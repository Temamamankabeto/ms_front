<?php

namespace App\Services;

use App\Models\User;
use App\Models\Service;
use App\Models\ServiceApplication;
use App\Models\ServiceApplicationData;
use App\Models\ServiceApplicationWorkflow;
use App\Models\ServiceApplicationHistory;
use App\Services\Concerns\ChecksServiceAvailability;
use App\Support\AppRoles;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use App\Models\ApplicationQueue;
class PublicApplicationService
{
    use ChecksServiceAvailability;

    public function __construct(
        protected ApplicationFileService $fileService
    ) {}

    public function getForm(Service $service)
    {
        return $service
            ->forms()
            ->with([
                'steps.sections.fields.conditions.dependsOnField',
                'steps.fields.conditions.dependsOnField',
                'sections.fields.conditions.dependsOnField',
                'fields.conditions.dependsOnField',
            ])
            ->where('is_active', true)
            ->latest()
            ->first();
    }

    public function apply(Service $service, ?User $user, array $payload)
{
    if (!$user) {
        throw ValidationException::withMessages([
            'user' => ['Authenticated user is required to submit an application.'],
        ]);
    }

    $this->assertServiceAvailableForSelection($service, $payload);

    $form = $this->getForm($service);

    if (!$form) {
        throw ValidationException::withMessages([
            'service_id' => ['No active form found for this service.'],
        ]);
    }

    $this->validateRequiredFields(
        $form->fields->where('is_active', true),
        $payload['data'] ?? [],
        $payload['files'] ?? []
    );

    return DB::transaction(function () use ($service, $user, $payload) {

        $firstWindow = $service->windows()
            ->orderBy('service_window.step_order')
            ->first();

        $application = ServiceApplication::create([
            'tracking_number'      => $this->generateTrackingNumber(),
            'service_id'           => $service->id,
            'administrative_level' => $payload['administrative_level'],
            'city_id'              => $payload['city_id'],
            'subcity_id'           => $payload['subcity_id'] ?? null,
            'woreda_id'            => $payload['woreda_id'] ?? null,
            'customer_id'          => $user->id,
            'current_window_id'    => $firstWindow?->id,
            'current_officer_id'   => null,
            'status'               => 'submitted',
            'current_stage'        => 'submitted',
            'priority'             => 'normal',
            'submitted_at'         => now(),
        ]);

        $legacyOwnershipColumns = [];

        if (Schema::hasColumn('service_applications', 'created_by')) {
            $legacyOwnershipColumns['created_by'] = $user->id;
        }

        if (Schema::hasColumn('service_applications', 'user_id')) {
            $legacyOwnershipColumns['user_id'] = $user->id;
        }

        if (!empty($legacyOwnershipColumns)) {
            $application->forceFill($legacyOwnershipColumns)->save();
        }

        /*
        |--------------------------------------------------------------------------
        | Create Queue
        |--------------------------------------------------------------------------
        */

       $prefix = strtoupper(substr(
    preg_replace('/[^A-Za-z]/', '', $service->name),
    0,
    2
));

if (empty($prefix)) {
    $prefix = 'SV';
}


$lastQueue = ApplicationQueue::where(
        'queue_number',
        'like',
        $prefix . '-%'
    )
    ->lockForUpdate()
    ->latest('id')
    ->first();


$nextNumber = $lastQueue
    ? ((int) substr($lastQueue->queue_number, 3)) + 1
    : 1;


$queueNumber = sprintf(
    '%s-%04d',
    $prefix,
    $nextNumber
);


$queue = ApplicationQueue::create([
    'service_application_id' => $application->id,
    'queue_number'           => $queueNumber,
    'position'               => $nextNumber,
    'status'                 => 'waiting',
]);
        /*
        |--------------------------------------------------------------------------
        | Application Data
        |--------------------------------------------------------------------------
        */

        foreach (($payload['data'] ?? []) as $field => $value) {
            ServiceApplicationData::create([
                'application_id' => $application->id,
                'field_name'     => (string) $field,
                'field_value'    => is_array($value)
                    ? json_encode($value)
                    : $value,
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Files
        |--------------------------------------------------------------------------
        */

        if (!empty($payload['files'])) {
            $this->fileService->storeFiles(
                $application,
                $payload['files'],
                $user
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Workflows
        |--------------------------------------------------------------------------
        */

        foreach (
            $service->windows()
                ->orderBy('service_window.step_order')
                ->get() as $window
        ) {
            ServiceApplicationWorkflow::create([
                'application_id' => $application->id,
                'window_id'      => $window->id,
                'from_stage'     => null,
                'to_stage'       => $window->name ?? null,
                'status'         => $window->id === $firstWindow?->id
                    ? 'processing'
                    : 'pending',
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | History
        |--------------------------------------------------------------------------
        */

        ServiceApplicationHistory::create([
            'application_id' => $application->id,
            'from_status'    => null,
            'to_status'      => 'submitted',
            'action'         => 'submitted',
            'action_type'    => 'submitted',
            'remark'         => 'Application submitted for '
                . $payload['administrative_level']
                . ' level',
            'actor_id'       => $user->id,
        ]);

        /*
        |--------------------------------------------------------------------------
        | SMS Notification
        |--------------------------------------------------------------------------
        */

        try {

            if (!empty($user->phone)) {

                $message = sprintf(
                    "Dear %s, your application has been submitted successfully. Tracking No: %s. Queue No: %s. Position: %d.",
                    $user->name,
                    $application->tracking_number,
                    $queue->queue_number,
                    $queue->position
                );

                app(\App\Services\SmsService::class)
                    ->send($user->phone, $message);
            }

        } catch (\Throwable $e) {

            \Log::error('Queue SMS failed', [
                'application_id' => $application->id,
                'error'          => $e->getMessage(),
            ]);
        }

        return $application->load([
            'service',
            'customer',
            'city',
            'subcity',
            'woreda',
            'data',
            'files',
            'workflows.window',
            'histories.actor',
            'queue',
        ]);
    });
}

    protected function assertServiceAvailableForSelection(Service $service, array $payload): void
    {
        $available = $this->serviceIsAvailableForSelection(
            $service,
            $payload['administrative_level'],
            (int) $payload['city_id'],
            isset($payload['subcity_id']) ? (int) $payload['subcity_id'] : null,
            isset($payload['woreda_id']) ? (int) $payload['woreda_id'] : null
        );

        if (!$available) {
            throw ValidationException::withMessages([
                'service_id' => ['This service is not available for the selected location.'],
            ]);
        }
    }

    protected function validateRequiredFields($fields, array $data, array $files): void
    {
        $errors = [];

        foreach ($fields as $field) {
            if (!$field->is_required) {
                continue;
            }

            $name = $field->name;
            $hasValue = array_key_exists($name, $data) && $data[$name] !== null && $data[$name] !== '';
            $hasFile = array_key_exists($name, $files) && !empty($files[$name]);

            if (!$hasValue && !$hasFile) {
                $errors["data.$name"] = ["The {$field->label} field is required."];
            }
        }

        if (!empty($errors)) {
            throw ValidationException::withMessages($errors);
        }
    }


    protected function firstAssignedFrontOfficer(ServiceApplication $application): ?User
    {
        $level = $application->administrative_level ?: AppRoles::LEVEL_CITY;

        return User::query()
            ->where('is_active', true)
            ->whereHas('roles', fn ($query) => $query->where('name', AppRoles::FRONT_OFFICER))
            ->whereExists(function ($query) use ($application, $level) {
                $query->selectRaw('1')
                    ->from('user_service_assignments')
                    ->whereColumn('user_service_assignments.user_id', 'users.id')
                    ->where('user_service_assignments.service_id', $application->service_id)
                    ->where('user_service_assignments.assignment_level', $level)
                    ->whereIn('user_service_assignments.officer_type', [
                        AppRoles::FRONT_OFFICER,
                        'front',
                    ])
                    ->where('user_service_assignments.is_active', true)
                    ->where(function ($windowQuery) use ($application) {
                        $windowQuery
                            ->where('user_service_assignments.window_id', $application->current_window_id)
                            ->orWhereNull('user_service_assignments.window_id')
                            ->orWhereExists(function ($query) use ($application) {
                                $query->selectRaw('1')
                                    ->from('officer_window_assignments')
                                    ->whereColumn('officer_window_assignments.officer_id', 'users.id')
                                    ->where('officer_window_assignments.window_id', $application->current_window_id)
                                    ->where('officer_window_assignments.assignment_level', $application->administrative_level)
                                    ->where('officer_window_assignments.is_active', true);
                            });
                    });
            })
            ->when($level === AppRoles::LEVEL_CITY, function ($query) use ($application) {
                $query->where('city_id', $application->city_id)
                    ->whereNull('subcity_id')
                    ->whereNull('woreda_id');
            })
            ->when($level === AppRoles::LEVEL_SUBCITY, function ($query) use ($application) {
                $query->where('city_id', $application->city_id)
                    ->where('subcity_id', $application->subcity_id)
                    ->whereNull('woreda_id');
            })
            ->when($level === AppRoles::LEVEL_WOREDA, function ($query) use ($application) {
                $query->where('city_id', $application->city_id)
                    ->where('subcity_id', $application->subcity_id)
                    ->where('woreda_id', $application->woreda_id);
            })
            ->orderBy('id')
            ->first();
    }

    protected function generateTrackingNumber(): string
    {
        do {
            $trackingNumber = sprintf(
                'ADA-%s-%06d',
                now()->format('Y'),
                random_int(1, 999999)
            );
        } while (ServiceApplication::where('tracking_number', $trackingNumber)->exists());

        return $trackingNumber;
    }
}
