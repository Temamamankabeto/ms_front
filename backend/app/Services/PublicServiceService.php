<?php

namespace App\Services;

use App\Models\Service;
use App\Models\Window;
use App\Services\Concerns\ChecksServiceAvailability;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class PublicServiceService
{
    use ChecksServiceAvailability;

    public function getAll(Request $request)
    {
        $query = Service::query()
            ->with([
                'windows' => function ($query) {
                    $query
                        ->select([
                            'windows.id',
                            'windows.name',
                            'windows.title',
                            'windows.city_title',
                            'windows.subcity_title',
                            'windows.woreda_title',
                            'windows.administrative_level',
                            'windows.availability',
                        ])
                        ->orderBy('service_window.step_order');
                },
            ])
            ->where('status', 'active');

        if ($request->filled('search')) {
            $query->where(function (Builder $query) use ($request) {
                $query->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('description', 'like', '%' . $request->search . '%');
            });
        }

        $services = $query
            ->latest()
            ->get()
            ->filter(fn (Service $service) => $this->matchesRequestAvailability($service, $request))
            ->values();

        $perPage = max((int) ($request->per_page ?? 12), 1);
        $page = max((int) ($request->page ?? 1), 1);

        return new LengthAwarePaginator(
            $services->forPage($page, $perPage)->values(),
            $services->count(),
            $perPage,
            $page,
            [
                'path' => $request->url(),
                'query' => $request->query(),
            ]
        );
    }

    public function featured()
    {
        return Service::query()
            ->with([
                'windows' => function ($query) {
                    $query
                        ->select([
                            'windows.id',
                            'windows.name',
                            'windows.title',
                            'windows.city_title',
                            'windows.subcity_title',
                            'windows.woreda_title',
                            'windows.administrative_level',
                            'windows.availability',
                        ])
                        ->orderBy('service_window.step_order');
                },
            ])
            ->where('status', 'active')
            ->latest()
            ->take(6)
            ->get();
    }

    public function groupByWindow(Request $request)
    {
        $level = strtolower((string) ($request->input('administrative_level') ?? $request->input('level') ?? 'city'));

        $windows = Window::with([
            'services' => function ($query) {
                $query->where('status', 'active')
                    ->with([
                        'windows' => function ($windowQuery) {
                            $windowQuery
                                ->select([
                                    'windows.id',
                                    'windows.name',
                                    'windows.title',
                                    'windows.city_title',
                                    'windows.subcity_title',
                                    'windows.woreda_title',
                                    'windows.administrative_level',
                                    'windows.availability',
                                ])
                                ->orderBy('service_window.step_order');
                        },
                    ]);
            },
        ])
            ->orderBy('name')
            ->get()
            ->filter(fn (Window $window) => in_array($level, $this->windowLevels($window), true))
            ->values();

        $assignedServiceIds = [];

        $windows->transform(function ($window) use (&$assignedServiceIds, $request, $level) {
            $filteredServices = $window->services
                ->filter(function ($service) use ($window, &$assignedServiceIds, $request, $level) {
                    if (in_array($service->id, $assignedServiceIds, true)) {
                        return false;
                    }

                    if (!$this->matchesRequestAvailability($service, $request)) {
                        return false;
                    }

                    $firstWindow = $service->windows
                        ->filter(fn (Window $serviceWindow) => in_array($level, $this->windowLevels($serviceWindow), true))
                        ->sortBy('pivot.step_order')
                        ->first();

                    if (!$firstWindow || $firstWindow->id !== $window->id) {
                        return false;
                    }

                    $assignedServiceIds[] = $service->id;

                    return true;
                })
                ->values()
                ->map(function (Service $service) use ($window, $level) {
                    $payload = $service->toArray();

                    $payload['window_id'] = $window->id;
                    $payload['window_name'] = $window->name;
                    $payload['window_title'] = $this->windowTitleForLevel($window, $level);
                    $payload['window_display_name'] = $this->windowDisplayName($window, $level);

                    return $payload;
                });

            $window->setRelation('services', $filteredServices);

            $window->title = $this->windowTitleForLevel($window, $level);
            $window->display_name = $this->windowDisplayName($window, $level);

            return $window;
        });

        return $windows
            ->filter(fn ($window) => $window->services->count() > 0)
            ->values()
            ->map(function (Window $window) use ($level) {
                return [
                    'id' => $window->id,
                    'name' => $window->name,
                    'title' => $this->windowTitleForLevel($window, $level),
                    'city_title' => $window->city_title,
                    'subcity_title' => $window->subcity_title,
                    'woreda_title' => $window->woreda_title,
                    'display_name' => $this->windowDisplayName($window, $level),
                    'administrative_level' => $level,
                    'availability' => $window->availability,
                    'services' => $window->services,
                ];
            });
    }

    private function matchesRequestAvailability(Service $service, Request $request): bool
    {
        $level = $request->input('administrative_level') ?? $request->input('level');

        if (!$level) {
            return false;
        }

        $level = strtolower((string) $level);

        return $this->serviceIsAvailableForSelection(
            $service,
            $level,
            $request->filled('city_id') ? $request->integer('city_id') : null,
            $request->filled('subcity_id') ? $request->integer('subcity_id') : null,
            $request->filled('woreda_id') ? $request->integer('woreda_id') : null
        );
    }

    private function windowTitleForLevel(Window $window, string $level): ?string
    {
        return match ($level) {
            'city' => $window->city_title ?? $window->title ?? null,
            'subcity' => $window->subcity_title ?? $window->title ?? null,
            'woreda' => $window->woreda_title ?? $window->title ?? null,
            default => $window->title ?? null,
        };
    }

    private function windowDisplayName(Window $window, string $level): string
    {
        $title = $this->windowTitleForLevel($window, $level);

        return trim($window->name . ($title ? " - {$title}" : ""));
    }

    private function windowLevels(Window $window): array
    {
        $availability = $window->availability;

        if (is_string($availability)) {
            $decoded = json_decode($availability, true);
            $availability = json_last_error() === JSON_ERROR_NONE ? $decoded : [];
        }

        if (is_array($availability)) {
            if (array_is_list($availability)) {
                return $availability;
            }

            if (isset($availability['levels']) && is_array($availability['levels'])) {
                return $availability['levels'];
            }

            if (isset($availability['administrative_levels']) && is_array($availability['administrative_levels'])) {
                return $availability['administrative_levels'];
            }

            return collect(['city', 'subcity', 'woreda'])
                ->filter(fn ($level) => ($availability[$level] ?? false) === true)
                ->values()
                ->all();
        }

        return $window->administrative_level ? [$window->administrative_level] : [];
    }
}
