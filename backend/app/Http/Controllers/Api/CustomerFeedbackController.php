<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CustomerFeedback;
use Illuminate\Http\Request;

class CustomerFeedbackController extends Controller
{
    public function show(string $token)
    {
        $feedback = CustomerFeedback::where(
            'feedback_token',
            $token
        )->firstOrFail();

        return response()->json([
            'success' => true,
            'data' => $feedback
        ]);
    }

    public function submit(Request $request, string $token)
    {
        $request->validate([
            'rating' => [
                'required',
                'in:very_satisfied,satisfied,not_satisfied,other'
            ],
            'comment' => ['nullable','string'],
        ]);

        $feedback = CustomerFeedback::where(
            'feedback_token',
            $token
        )->firstOrFail();

        if ($feedback->submitted_at) {
            return response()->json([
                'success' => false,
                'message' => 'Feedback already submitted'
            ], 422);
        }

        $feedback->update([
            'rating' => $request->rating,
            'comment' => $request->comment,
            'submitted_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Thank you for your feedback'
        ]);
    }
}