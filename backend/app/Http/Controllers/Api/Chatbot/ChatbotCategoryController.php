<?php

namespace App\Http\Controllers\Api\Chatbot;

use App\Http\Controllers\Controller;
use App\Models\ChatbotCategory;
use Illuminate\Http\Request;

class ChatbotCategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = ChatbotCategory::query()
            ->withCount('trainingQuestions')
            ->when($request->filled('search'), fn ($q) => $q->where(fn ($x) => $x
                ->where('name', 'like', '%' . $request->search . '%')
                ->orWhere('code', 'like', '%' . $request->search . '%')))
            ->orderBy('name');

        $items = $query->paginate(min((int) $request->integer('per_page', 20), 100));

        return response()->json([
            'success' => true,
            'message' => 'Chatbot categories retrieved successfully',
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
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:255', 'unique:chatbot_categories,code'],
            'description' => ['nullable', 'string'],
            'allowed_roles' => ['nullable', 'array'],
            'blocked_roles' => ['nullable', 'array'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $item = ChatbotCategory::create([...$data, 'is_active' => $request->boolean('is_active', true)]);

        return response()->json(['success' => true, 'message' => 'Chatbot category created successfully', 'data' => $item], 201);
    }

    public function show(ChatbotCategory $chatbotCategory)
    {
        return response()->json(['success' => true, 'message' => 'Chatbot category retrieved successfully', 'data' => $chatbotCategory->load('trainingQuestions')]);
    }

    public function update(Request $request, ChatbotCategory $chatbotCategory)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'code' => ['sometimes', 'required', 'string', 'max:255', 'unique:chatbot_categories,code,' . $chatbotCategory->id],
            'description' => ['nullable', 'string'],
            'allowed_roles' => ['nullable', 'array'],
            'blocked_roles' => ['nullable', 'array'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $chatbotCategory->update($data);

        return response()->json(['success' => true, 'message' => 'Chatbot category updated successfully', 'data' => $chatbotCategory->fresh()]);
    }

    public function destroy(ChatbotCategory $chatbotCategory)
    {
        $chatbotCategory->delete();

        return response()->json(['success' => true, 'message' => 'Chatbot category deleted successfully', 'data' => null]);
    }
}
