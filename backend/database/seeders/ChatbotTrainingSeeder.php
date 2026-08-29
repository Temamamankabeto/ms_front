<?php

namespace Database\Seeders;

use App\Models\ChatbotCategory;
use App\Models\ChatbotTrainingQuestion;
use Illuminate\Database\Seeder;

class ChatbotTrainingSeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Service List', 'code' => 'service_list', 'description' => 'List active services', 'allowed_roles' => ['*'], 'blocked_roles' => [], 'action_type' => 'query_services'],
            ['name' => 'Service Criteria', 'code' => 'service_criteria', 'description' => 'Show service criteria', 'allowed_roles' => ['*'], 'blocked_roles' => [], 'action_type' => 'query_service_criteria'],
            ['name' => 'Apply Steps', 'code' => 'apply_steps', 'description' => 'Explain application steps', 'allowed_roles' => ['*'], 'blocked_roles' => [], 'action_type' => 'apply_steps'],
            ['name' => 'Tracking', 'code' => 'tracking', 'description' => 'Track application', 'allowed_roles' => ['*'], 'blocked_roles' => [], 'action_type' => 'tracking'],
            ['name' => 'Appointment', 'code' => 'appointment', 'description' => 'Appointment information', 'allowed_roles' => ['*'], 'blocked_roles' => [], 'action_type' => 'appointment_status'],
            ['name' => 'Payment', 'code' => 'payment', 'description' => 'Payment information', 'allowed_roles' => ['*'], 'blocked_roles' => [], 'action_type' => 'payment_status'],
            ['name' => 'Resubmit', 'code' => 'resubmit', 'description' => 'Resubmission help', 'allowed_roles' => ['*'], 'blocked_roles' => [], 'action_type' => 'resubmit_help'],
            ['name' => 'Documents', 'code' => 'documents', 'description' => 'Document summary', 'allowed_roles' => ['*'], 'blocked_roles' => [], 'action_type' => 'document_summary'],
            ['name' => 'Customer Dashboard Report', 'code' => 'customer_dashboard_report', 'description' => 'Customer own summary', 'allowed_roles' => ['customer', 'citizen'], 'blocked_roles' => [], 'action_type' => 'customer_dashboard_report'],
            ['name' => 'Officer Queue Report', 'code' => 'officer_queue_report', 'description' => 'Officer queue reporting help', 'allowed_roles' => ['front_officer', 'back_officer', 'manager', 'admin', 'super_admin'], 'blocked_roles' => ['public', 'customer', 'citizen'], 'action_type' => 'officer_queue_report'],
            ['name' => 'Manager Report', 'code' => 'manager_report', 'description' => 'Manager reporting help', 'allowed_roles' => ['manager', 'admin', 'super_admin'], 'blocked_roles' => ['public', 'customer', 'citizen'], 'action_type' => 'manager_report'],
            ['name' => 'Admin User Report', 'code' => 'admin_user_report', 'description' => 'Admin user/config reports', 'allowed_roles' => ['admin', 'super_admin'], 'blocked_roles' => ['public', 'customer', 'citizen'], 'action_type' => 'admin_user_report'],
            ['name' => 'Blocked Customer Internal', 'code' => 'blocked_customer_internal', 'description' => 'Block internal office questions from customers/public', 'allowed_roles' => ['*'], 'blocked_roles' => [], 'action_type' => 'blocked_customer_internal'],
            ['name' => 'Fallback', 'code' => 'fallback', 'description' => 'Default fallback', 'allowed_roles' => ['*'], 'blocked_roles' => [], 'action_type' => 'static_answer'],
        ];

        foreach ($categories as $category) {
            $actionType = $category['action_type'];
            unset($category['action_type']);

            $model = ChatbotCategory::updateOrCreate(
                ['code' => $category['code']],
                [...$category, 'is_active' => true]
            );

            $this->seedQuestion($model, $this->defaultQuestion($model->code), $this->defaultKeywords($model->code), $this->defaultAnswer($model->code), $actionType);
        }
    }

    protected function seedQuestion(ChatbotCategory $category, string $question, array $keywords, string $answer, string $actionType): void
    {
        ChatbotTrainingQuestion::updateOrCreate(
            ['category_id' => $category->id, 'question' => $question],
            [
                'keywords' => $keywords,
                'language' => 'en',
                'answer_template' => $answer,
                'action_type' => $actionType,
                'is_active' => true,
            ]
        );
    }

    protected function defaultQuestion(string $code): string
    {
        return match ($code) {
            'service_list' => 'What services are available?',
            'service_criteria' => 'What documents are required?',
            'apply_steps' => 'How can I apply?',
            'tracking' => 'Track my application',
            'appointment' => 'Do I have appointment?',
            'payment' => 'What is my payment status?',
            'resubmit' => 'How can I resubmit?',
            'documents' => 'Can I download submitted documents?',
            'customer_dashboard_report' => 'Show my application summary',
            'officer_queue_report' => 'Show my officer queue report',
            'manager_report' => 'Show manager report',
            'admin_user_report' => 'Show user report',
            'blocked_customer_internal' => 'Who is assigned officer?',
            default => 'Fallback',
        };
    }

    protected function defaultKeywords(string $code): array
    {
        return match ($code) {
            'service_list' => ['services', 'list services', 'available services', 'what can i apply'],
            'service_criteria' => ['criteria', 'requirements', 'documents', 'required', 'needed'],
            'apply_steps' => ['apply', 'how to apply', 'submit', 'application form'],
            'tracking' => ['track', 'tracking', 'status', 'application status'],
            'appointment' => ['appointment', 'schedule', 'date', 'time'],
            'payment' => ['payment', 'fee', 'paid', 'receipt'],
            'resubmit' => ['resubmit', 'returned', 'rejected', 'correction'],
            'documents' => ['documents', 'files', 'download', 'certificate'],
            'customer_dashboard_report' => ['my report', 'my applications', 'summary'],
            'officer_queue_report' => ['assigned applications', 'shared applications', 'officer report'],
            'manager_report' => ['manager report', 'escalated applications', 'workload'],
            'admin_user_report' => ['user report', 'activation requests', 'users by role'],
            'blocked_customer_internal' => ['officer', 'assigned officer', 'officer list', 'service window', 'officer window'],
            default => ['fallback'],
        };
    }

    protected function defaultAnswer(string $code): string
    {
        return match ($code) {
            'blocked_customer_internal' => 'This is internal office information and cannot be shared with customers.',
            'fallback' => 'I could not understand your question clearly. Please ask with a service name, tracking number, officer name, window name, or location.',
            default => '',
        };
    }
}
