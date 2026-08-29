<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class ScopeAccessMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Example scope logic
        if ($user->role === 'subcity_admin') {
            $request->merge(['subcity_id' => $user->subcity_id]);
        }

        if ($user->role === 'woreda_admin') {
            $request->merge(['woreda_id' => $user->woreda_id]);
        }

        return $next($request);
    }
}
