<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\URL;

class ServiceApplicationFile extends Model
{
    protected $fillable = [
        'application_id',
        'field_name',
        'original_name',
        'stored_name',
        'path',
        'mime_type',
        'size',
        'uploaded_by',
        'file_category',
        'verification_status',
        'verified_by',
        'verified_at',
    ];

    protected $casts = [
        'application_id' => 'integer',
        'uploaded_by' => 'integer',
        'verified_by' => 'integer',
        'size' => 'integer',
        'verified_at' => 'datetime',
    ];

    protected $appends = [
        'download_url',
        'display_status',
        'display_category',
    ];

    public function getDownloadUrlAttribute(): ?string
    {
        if (! $this->id) {
            return null;
        }

        /*
         * Files are private. Do not expose /storage/... public links.
         * The frontend opens this protected API route, and the backend checks:
         * - authenticated user
         * - customer ownership
         * - officer/admin authorization
         */
        return URL::to("/api/service-application-files/{$this->id}/download");
    }

    public function getDisplayStatusAttribute(): string
    {
        return match ($this->file_category) {
            'workflow_documents' => 'Workflow Document',
            'correction_documents' => 'Correction Document',
            'approval_documents' => 'Approval Document',
            'final_documents' => 'Final Document',
            'certificate' => 'Certificate',
            default => 'Submitted Document',
        };
    }

    public function getDisplayCategoryAttribute(): string
    {
        return match ($this->file_category) {
            'workflow_documents' => 'Workflow',
            'correction_documents' => 'Correction',
            'approval_documents' => 'Approval',
            'final_documents' => 'Final',
            'certificate' => 'Certificate',
            default => 'Submitted',
        };
    }

    public function application()
    {
        return $this->belongsTo(ServiceApplication::class, 'application_id');
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function verifier()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}
