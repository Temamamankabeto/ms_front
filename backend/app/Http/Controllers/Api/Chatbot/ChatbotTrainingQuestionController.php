<?php

namespace App\Http\Controllers\Api\Chatbot;

use App\Http\Controllers\Controller;
use App\Models\ChatbotTrainingQuestion;
use Illuminate\Http\Request;

class ChatbotTrainingQuestionController extends Controller
{
    public function index(Request $request)
    {
        $query = ChatbotTrainingQuestion::query()
            ->with('category:id,name,code')
            ->when($request->filled('category_id'), fn ($q) => $q->where('category_id', $request->integer('category_id')))
            ->when($request->filled('search'), fn ($q) => $q->where(fn ($x) => $x
                ->where('question', 'like', '%' . $request->search . '%')
                ->orWhere('normalized_question', 'like', '%' . $request->search . '%')
                ->orWhere('answer_template', 'like', '%' . $request->search . '%')))
            ->latest();

       $perPage = (int) $request->input('per_page', 2);
$perPage = max(1, min($perPage, 100));

$items = $query->paginate($perPage);

       return response()->json([
    'success' => true,
    'message' => 'Chatbot training questions retrieved successfully',
    'data' => $items->items(),
    'meta' => [
        'current_page' => $items->currentPage(),
        'last_page' => $items->lastPage(),
        'per_page' => $items->perPage(),
        'total' => $items->total(),
    ],
]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'category_id' => ['required', 'integer', 'exists:chatbot_categories,id'],
            'question' => ['required', 'string'],
            'keywords' => ['nullable', 'array'],
            'language' => ['nullable', 'string', 'max:10'],
            'answer_template' => ['nullable', 'string'],
            'action_type' => ['required', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $item = ChatbotTrainingQuestion::create([
            ...$data,
            'language' => $data['language'] ?? 'en',
            'is_active' => $request->boolean('is_active', true),
        ])->load('category:id,name,code');

        return response()->json(['success' => true, 'message' => 'Training question created successfully', 'data' => $item], 201);
    }

    public function show(ChatbotTrainingQuestion $chatbotTrainingQuestion)
    {
        return response()->json(['success' => true, 'message' => 'Training question retrieved successfully', 'data' => $chatbotTrainingQuestion->load('category:id,name,code')]);
    }

    public function update(Request $request, ChatbotTrainingQuestion $chatbotTrainingQuestion)
    {
        $data = $request->validate([
            'category_id' => ['sometimes', 'required', 'integer', 'exists:chatbot_categories,id'],
            'question' => ['sometimes', 'required', 'string'],
            'keywords' => ['nullable', 'array'],
            'language' => ['nullable', 'string', 'max:10'],
            'answer_template' => ['nullable', 'string'],
            'action_type' => ['sometimes', 'required', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $chatbotTrainingQuestion->update($data);

        return response()->json(['success' => true, 'message' => 'Training question updated successfully', 'data' => $chatbotTrainingQuestion->fresh('category:id,name,code')]);
    }

    public function destroy(ChatbotTrainingQuestion $chatbotTrainingQuestion)
    {
        $chatbotTrainingQuestion->delete();

        return response()->json(['success' => true, 'message' => 'Training question deleted successfully', 'data' => null]);
    }
}
