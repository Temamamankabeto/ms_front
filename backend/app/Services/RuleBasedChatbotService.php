<?php

namespace App\Services;

use App\Models\ChatbotCategory;
use App\Models\ChatbotConversation;
use App\Models\ChatbotTrainingQuestion;
use App\Models\City;
use App\Models\Service;
use App\Models\ServiceApplication;
use App\Models\Subcity;
use App\Models\User;
use App\Models\Woreda;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class RuleBasedChatbotService
{
    public function reply(?User $user, string $message, ?string $sessionId = null, string $source = 'web'): array
    {
        $question = trim($message);
        $normalized = ChatbotTrainingQuestion::normalize($question);
        $language = $this->detectLanguage($question);
        $role = $this->roleName($user);
        $scope = $this->scopeName($user);
        $context = $this->lastContext($sessionId, $user);

        $match = $this->findBestMatch($normalized, $language);
        $category = $match?->category;

        if (! $category) {
            $category = ChatbotCategory::where('code', 'fallback')->where('is_active', true)->first();
        }

        if ($category && ! $this->roleAllowed($category, $role)) {
            $blocked = ChatbotCategory::where('code', 'blocked_customer_internal')->where('is_active', true)->first();
            $category = $blocked ?: $category;
            $match = $category?->trainingQuestions()->where('is_active', true)->first();
        }

        $answer = $this->runAction($user, $question, $normalized, $category, $match, $context);

        $this->saveConversation(
            $user,
            $sessionId,
            $role,
            $scope,
            $question,
            $normalized,
            $category?->id,
            $answer['reply'],
            $answer['context'] ?? null
        );

        return [
            'reply' => $answer['reply'],
            'intent' => $category?->code ?? 'fallback',
            'role' => $role,
            'scope' => $scope,
            'language' => $language,
            'suggestions' => $answer['suggestions'] ?? $this->defaultSuggestions($role),
            'context' => $answer['context'] ?? null,
        ];
    }

    protected function findBestMatch(string $normalized, string $language): ?ChatbotTrainingQuestion
    {
        $questions = ChatbotTrainingQuestion::query()
            ->with('category')
            ->where('is_active', true)
            ->whereHas('category', fn ($q) => $q->where('is_active', true))
            ->get();

        $best = null;
        $bestScore = 0;

        foreach ($questions as $question) {
            $score = $this->scoreQuestion($normalized, $question, $language);

            if ($score > $bestScore) {
                $bestScore = $score;
                $best = $question;
            }
        }

        return $bestScore > 0 ? $best : null;
    }

    protected function scoreQuestion(string $normalized, ChatbotTrainingQuestion $question, string $language): int
    {
        $score = 0;

        if ($question->language === $language) {
            $score += 10;
        }

        if ($question->normalized_question && str_contains($normalized, $question->normalized_question)) {
            $score += 100;
        }

        foreach (($question->keywords ?? []) as $keyword) {
            $keyword = ChatbotTrainingQuestion::normalize($keyword);

            if ($keyword && str_contains($normalized, $keyword)) {
                $score += 20 + mb_strlen($keyword);
            }
        }

        foreach (explode(' ', $normalized) as $word) {
            if (mb_strlen($word) > 2 && str_contains((string) $question->normalized_question, $word)) {
                $score += 2;
            }
        }

        return $score;
    }

    protected function roleAllowed(ChatbotCategory $category, string $role): bool
    {
        $role = $this->normalizeRole($role);
        $allowed = collect($category->allowed_roles ?? [])->map(fn ($item) => $this->normalizeRole($item))->values();
        $blocked = collect($category->blocked_roles ?? [])->map(fn ($item) => $this->normalizeRole($item))->values();

        if ($blocked->contains($role)) {
            return false;
        }

        if ($allowed->isEmpty()) {
            return true;
        }

        if ($allowed->contains('*')) {
            return true;
        }

        return $allowed->contains($role)
            || $allowed->contains(fn ($allowedRole) => str_contains($role, $allowedRole) || str_contains($allowedRole, $role));
    }

    protected function runAction(?User $user, string $question, string $normalized, ?ChatbotCategory $category, ?ChatbotTrainingQuestion $training, ?array $context): array
    {
        $action = $training?->action_type ?: $category?->code ?: 'fallback';

        return match ($action) {
            'query_services', 'service_list' => $this->queryServices(),
            'query_service_criteria', 'service_criteria' => $this->queryServiceCriteria($question, $training),
            'apply_steps', 'public_apply_help' => $this->applySteps($question),
            'tracking', 'application_tracking' => $this->trackApplication($user, $question),
            'appointment_status', 'appointment' => $this->appointmentStatus($user, $question),
            'payment_status', 'payment' => $this->paymentStatus($user, $question),
            'resubmit_help', 'resubmit' => $this->resubmitHelp($user, $question),
            'document_summary', 'documents' => $this->documentSummary($user, $question),
            'customer_dashboard_report' => $this->customerDashboardReport($user),
            'officer_queue_report' => $this->roleGuide($training, 'Officer queue report is available from Officer Applications. Ask about assigned, shared, returned, completed, rejected, SLA overdue, service or window reports.'),
            'manager_report' => $this->roleGuide($training, 'Manager report is available from Manager dashboard. Ask about escalations, workload, SLA, bottlenecks, rejected reasons, appointment or completed applications.'),
            'admin_user_report' => $this->roleGuide($training, 'Admin reports are available from dashboard modules. Ask about users, activation requests, services, windows, forms, assignments or application summary.'),
            'super_admin_report' => $this->roleGuide($training, 'Super Admin can view full system reports: users, services, applications, windows, assignments, payment, appointment, SLA, audit logs and comparisons.'),
            'blocked_customer_internal' => $this->blockedCustomerInternal($training),
            'static_answer' => $this->staticAnswer($training),
            default => $this->staticAnswer($training),
        };
    }

    protected function queryServices(): array
    {
        $services = Service::where('status', 'active')->orderBy('name')->limit(15)->get(['id', 'name']);
        $list = $services->map(fn ($service, $index) => ($index + 1) . '. ' . $service->name)->implode("\n") ?: '-';

        return [
            'reply' => "Available MESOB services:\n{$list}\n\nWrite the service name to continue.",
            'suggestions' => $services->take(4)->pluck('name')->values()->all(),
        ];
    }

    protected function queryServiceCriteria(string $question, ?ChatbotTrainingQuestion $training): array
    {
        $service = $this->findServiceInMessage($question);

        if (! $service) {
            return ['reply' => $training?->answer_template ?: 'Which service criteria do you want to know? Please mention the service name.'];
        }

        $service->load(['criteria' => fn ($q) => $q->where('is_active', true)->orderBy('sort_order')]);

        $items = $service->criteria
            ->flatMap(fn ($criterion) => $criterion->criteria_items ?: preg_split('/\r\n|\r|\n/', (string) $criterion->criteria))
            ->map(fn ($item) => trim((string) $item))
            ->filter()
            ->values();

        if ($items->isEmpty()) {
            return ['reply' => "No criteria are configured yet for {$service->name}."];
        }

        $list = $items->map(fn ($item, $index) => ($index + 1) . '. ' . $item)->implode("\n");

        return ['reply' => "Criteria for {$service->name}:\n{$list}"];
    }

    protected function applySteps(string $question): array
    {
        $service = $this->findServiceInMessage($question);

        if (! $service) {
            return [
                'reply' => "To apply: login/register, search service, read criteria, select level/location, fill form, upload files, submit, and save tracking number.\n\nWhich service do you want to apply for?",
                'context' => ['flow' => 'apply_select_service'],
                'suggestions' => ['List services', 'Service criteria'],
            ];
        }

        return [
            'reply' => "Open the service page and click Apply Now:\n/services/{$service->id}\n\nThen select city/subcity/woreda, fill the form, upload files, and submit.",
            'suggestions' => ['Service criteria', 'Track application'],
        ];
    }

    protected function trackApplication(?User $user, string $question): array
    {
        $application = $this->findApplication($user, $question);

        if (! $application) {
            return ['reply' => 'Application not found. Please provide a valid tracking number. Logged-in customers can only view their own applications.'];
        }

        $appointment = $application->appointments()->latest('appointment_at')->first();
        $appointmentText = $appointment ? "\nAppointment: {$appointment->appointment_at?->format('Y-m-d H:i')} at " . ($appointment->location ?: '-') : '';
        $reason = $application->rejection_reason ? "\nReason: {$application->rejection_reason}" : '';

        return ['reply' => "Application {$application->tracking_number}\nService: {$application->service?->name}\nStatus: {$this->statusLabel($application->status)}{$appointmentText}{$reason}"];
    }

    protected function appointmentStatus(?User $user, string $question): array
    {
        $application = $this->findApplication($user, $question);

        if (! $application) {
            return ['reply' => 'Please provide tracking number or login to check appointment.'];
        }

        $appointment = $application->appointments()->latest('appointment_at')->first();

        if (! $appointment) {
            return ['reply' => 'No appointment is scheduled for this application yet.'];
        }

        return ['reply' => "Appointment: {$appointment->appointment_at?->format('Y-m-d H:i')}\nLocation: " . ($appointment->location ?: '-') . "\nMessage: " . ($appointment->message ?: '-')];
    }

    protected function paymentStatus(?User $user, string $question): array
    {
        $application = $this->findApplication($user, $question);

        if (! $application) {
            return ['reply' => 'Please provide tracking number or login to check payment.'];
        }

        if (! Schema::hasTable('payments')) {
            return ['reply' => 'Payment module is not enabled. Service fee: ' . ($application->service?->service_fee ?? 0) . ' ETB.'];
        }

        $columns = Schema::getColumnListing('payments');
        $applicationColumn = collect(['service_application_id', 'application_id'])->first(fn ($column) => in_array($column, $columns, true));

        if (! $applicationColumn) {
            return ['reply' => 'Payment records are not linked to applications yet.'];
        }

        $payment = DB::table('payments')->where($applicationColumn, $application->id)->latest('id')->first();

        return ['reply' => $payment ? 'Payment status: ' . ($payment->status ?? 'pending') : 'No payment record found for this application.'];
    }

    protected function resubmitHelp(?User $user, string $question): array
    {
        $application = $this->findApplication($user, $question);

        if (! $application) {
            return ['reply' => 'To resubmit, open your returned/rejected application detail, correct the requested information or files, then click Resubmit. If you want to apply again, tell me the service name.'];
        }

        $reason = $application->rejection_reason
            ?: $application->histories()->whereIn('to_status', ['rejected', 'returned_to_customer', 'back_officer_rejected'])->latest()->value('remark');

        return ['reply' => ($reason ? "Reason: {$reason}\n" : '') . 'To resubmit, open the application detail page, update requested information/files, then click Resubmit.'];
    }

    protected function documentSummary(?User $user, string $question): array
    {
        $application = $this->findApplication($user, $question);

        if (! $application) {
            return ['reply' => 'Please provide tracking number or login to see document summary.'];
        }

        $count = $application->files()->count();

        return ['reply' => "This application has {$count} uploaded file(s). Open the application detail page to download allowed documents."];
    }

    protected function customerDashboardReport(?User $user): array
    {
        if (! $user) {
            return ['reply' => 'Please login to see your report.'];
        }

        $query = ServiceApplication::where('customer_id', $user->id);

        return [
            'reply' => "Your application summary:\nTotal: " . (clone $query)->count() .
                "\nPending/In progress: " . (clone $query)->whereIn('status', ['submitted', 'accepted', 'under_review', 'appointment_scheduled'])->count() .
                "\nApproved/Completed: " . (clone $query)->whereIn('status', ['approved', 'completed'])->count() .
                "\nReturned/Rejected: " . (clone $query)->whereIn('status', ['rejected', 'returned_to_customer'])->count(),
        ];
    }

    protected function roleGuide(?ChatbotTrainingQuestion $training, string $fallback): array
    {
        return ['reply' => $training?->answer_template ?: $fallback];
    }

    protected function blockedCustomerInternal(?ChatbotTrainingQuestion $training): array
    {
        return ['reply' => $training?->answer_template ?: 'This is internal office information and cannot be shared with customers. I can help you with services, service criteria, how to apply, tracking, appointment, payment, and returned application guidance.'];
    }

    protected function staticAnswer(?ChatbotTrainingQuestion $training): array
    {
        return ['reply' => $training?->answer_template ?: 'I could not understand your question clearly. Please ask with a service name, tracking number, officer name, window name, or location.'];
    }

    protected function findServiceInMessage(string $message): ?Service
    {
        $normalized = ChatbotTrainingQuestion::normalize($message);

        return Service::where('status', 'active')->with('criteria')->get()->first(function ($service) use ($normalized) {
            $name = ChatbotTrainingQuestion::normalize($service->name);

            if ($name && str_contains($normalized, $name)) {
                return true;
            }

            $words = collect(explode(' ', $name))->filter(fn ($word) => mb_strlen($word) > 2);

            return $words->count() >= 2
                ? $words->filter(fn ($word) => str_contains($normalized, $word))->count() >= 2
                : $words->contains(fn ($word) => str_contains($normalized, $word));
        });
    }

    protected function findApplication(?User $user, string $question): ?ServiceApplication
    {
        $tracking = $this->extractTrackingNumber($question);
        $query = ServiceApplication::with(['service', 'appointments', 'histories']);

        if ($user && $this->isCustomerRole($user)) {
            $query->where('customer_id', $user->id);
        }

        if ($tracking) {
            return $query->where(fn ($q) => $q->where('tracking_number', $tracking)->orWhere('id', $tracking))->latest('updated_at')->first();
        }

        if ($user && str_contains(ChatbotTrainingQuestion::normalize($question), 'my')) {
            return $query->latest('updated_at')->first();
        }

        return null;
    }

    protected function extractTrackingNumber(string $message): ?string
    {
        if (preg_match('/\b[A-Z]{2,10}-\d{4}-[A-Z0-9-]+\b/i', $message, $matches)) {
            return strtoupper($matches[0]);
        }

        return null;
    }

    protected function isCustomerRole(User $user): bool
    {
        $role = $this->normalizeRole($this->roleName($user));

        return str_contains($role, 'customer') || str_contains($role, 'citizen');
    }

    protected function roleName(?User $user): string
    {
        if (! $user) {
            return 'public';
        }

        if (method_exists($user, 'getRoleNames')) {
            return (string) ($user->getRoleNames()->first() ?: $user->role ?: 'user');
        }

        return (string) ($user->role ?: 'user');
    }

    protected function normalizeRole(string $role): string
    {
        return Str::of($role)->lower()->replace('-', '_')->replace(' ', '_')->toString();
    }

    protected function scopeName(?User $user): string
    {
        if (! $user) return 'public';
        if ($user->woreda_id) return 'woreda';
        if ($user->subcity_id) return 'subcity';
        if ($user->city_id) return 'city';

        return 'system';
    }

    protected function detectLanguage(string $question): string
    {
        if (preg_match('/[\x{1200}-\x{137F}]/u', $question)) {
            return 'am';
        }

        foreach (['akkam', 'maal', 'eessa', 'tajaajila', 'iyyata', 'kaffaltii', 'beellama', 'ulaagaa', 'gabaasa'] as $word) {
            if (str_contains(Str::lower($question), $word)) {
                return 'om';
            }
        }

        return 'en';
    }

    protected function lastContext(?string $sessionId, ?User $user): ?array
    {
        if (! $sessionId || ! Schema::hasTable('chatbot_conversations')) {
            return null;
        }

        $query = ChatbotConversation::where('session_id', $sessionId)->whereNotNull('source_context');

        if ($user) {
            $query->where(fn ($q) => $q->whereNull('user_id')->orWhere('user_id', $user->id));
        }

        return $query->latest()->value('source_context');
    }

    protected function saveConversation(?User $user, ?string $sessionId, string $role, string $scope, string $question, string $normalized, ?int $categoryId, string $answer, ?array $context = null): void
    {
        if (! Schema::hasTable('chatbot_conversations')) {
            return;
        }

        ChatbotConversation::create([
            'user_id' => $user?->id,
            'session_id' => $sessionId,
            'role' => $role,
            'scope' => $scope,
            'question' => $question,
            'normalized_question' => $normalized,
            'matched_category_id' => $categoryId,
            'answer' => $answer,
            'source_context' => $context,
        ]);
    }

    protected function defaultSuggestions(string $role): array
    {
        if ($role === 'public') {
            return ['List services', 'How to apply?', 'Service criteria', 'Track application'];
        }

        return ['Show my report', 'List services', 'Track application', 'How to apply?'];
    }

    protected function statusLabel(?string $status): string
    {
        return Str::of($status ?: '-')->replace('_', ' ')->title()->toString();
    }
}
