<?php

namespace App\Support;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class PaginationResponse
{
    public static function format(LengthAwarePaginator $paginator, array $extra = []): array
    {
        $meta = [
            'current_page' => $paginator->currentPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'last_page' => $paginator->lastPage(),
        ];

        if (! empty($extra)) {
            $meta = array_merge($meta, $extra);
        }

        return [
            'success' => true,
            'data' => $paginator->items(),
            'meta' => $meta,
        ];
    }
}
