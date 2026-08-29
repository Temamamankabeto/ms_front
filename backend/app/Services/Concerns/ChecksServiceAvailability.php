<?php

namespace App\Services\Concerns;

use App\Models\Service;

trait ChecksServiceAvailability
{
    protected function serviceIsAvailableForSelection(
        Service $service,
        string $level,
        ?int $cityId = null,
        ?int $subcityId = null,
        ?int $woredaId = null
    ): bool {
        $availability = $this->normalizeAvailability($service->availability);

        /*
        |--------------------------------------------------------------------------
        | STRICT PUBLIC FILTER
        |--------------------------------------------------------------------------
        | If availability is not configured, do NOT show the service publicly.
        | This prevents city/subcity/woreda lists from showing the same services.
        */
        if (!$availability) {
            return false;
        }

        $levels = $availability['levels'] ?? [];

        if (!in_array($level, $levels, true)) {
            return false;
        }

        return match ($level) {
            'city' => $this->idAllowed($availability['city_ids'] ?? null, $cityId),
            'subcity' => $this->idAllowed($availability['subcity_ids'] ?? null, $subcityId),
            'woreda' => $this->idAllowed($availability['woreda_ids'] ?? null, $woredaId),
            default => false,
        };
    }

    protected function normalizeAvailability(mixed $availability): ?array
    {
        if (!$availability) {
            return null;
        }

        if (is_string($availability)) {
            $decoded = json_decode($availability, true);

            if (json_last_error() === JSON_ERROR_NONE) {
                $availability = $decoded;
            }
        }

        if (!is_array($availability)) {
            return null;
        }

        /*
        |--------------------------------------------------------------------------
        | Supported format 1: recommended
        |--------------------------------------------------------------------------
        | {"levels":["city","subcity"],"subcity_ids":[1,2]}
        */
        if (array_key_exists('levels', $availability) || array_key_exists('administrative_levels', $availability)) {
            return [
                'levels' => $this->normalizeStringArray($availability['levels'] ?? $availability['administrative_levels'] ?? []),
                'city_ids' => $this->normalizeIdArray($availability['city_ids'] ?? null),
                'subcity_ids' => $this->normalizeIdArray($availability['subcity_ids'] ?? null),
                'woreda_ids' => $this->normalizeIdArray($availability['woreda_ids'] ?? null),
            ];
        }

        /*
        |--------------------------------------------------------------------------
        | Supported format 2: simple array
        |--------------------------------------------------------------------------
        | ["city","subcity","woreda"]
        */
        if (array_is_list($availability)) {
            return [
                'levels' => $this->normalizeStringArray($availability),
                'city_ids' => null,
                'subcity_ids' => null,
                'woreda_ids' => null,
            ];
        }

        /*
        |--------------------------------------------------------------------------
        | Supported format 3: boolean object
        |--------------------------------------------------------------------------
        | {"city":true,"subcity":false,"woreda":true}
        */
        $levels = [];

        foreach (['city', 'subcity', 'woreda'] as $level) {
            if (($availability[$level] ?? false) === true) {
                $levels[] = $level;
            }
        }

        if ($levels) {
            return [
                'levels' => $levels,
                'city_ids' => $this->normalizeIdArray($availability['city_ids'] ?? null),
                'subcity_ids' => $this->normalizeIdArray($availability['subcity_ids'] ?? null),
                'woreda_ids' => $this->normalizeIdArray($availability['woreda_ids'] ?? null),
            ];
        }

        return null;
    }

    protected function idAllowed(?array $allowedIds, ?int $selectedId): bool
    {
        /*
        |--------------------------------------------------------------------------
        | No IDs = available to ALL locations of that level.
        |--------------------------------------------------------------------------
        | Example: {"levels":["subcity"]} means all subcities.
        */
        if (!$allowedIds || count($allowedIds) === 0) {
            return true;
        }

        return in_array((int) $selectedId, $allowedIds, true);
    }

    protected function normalizeStringArray(mixed $value): array
    {
        if (is_string($value)) {
            $value = [$value];
        }

        if (!is_array($value)) {
            return [];
        }

        return collect($value)
            ->map(fn ($item) => strtolower(trim((string) $item)))
            ->filter(fn ($item) => in_array($item, ['city', 'subcity', 'woreda'], true))
            ->unique()
            ->values()
            ->all();
    }

    protected function normalizeIdArray(mixed $value): ?array
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_string($value) || is_numeric($value)) {
            $value = [$value];
        }

        if (!is_array($value)) {
            return null;
        }

        return collect($value)
            ->map(fn ($item) => (int) $item)
            ->filter(fn ($item) => $item > 0)
            ->unique()
            ->values()
            ->all();
    }
}
