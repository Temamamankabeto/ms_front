<?php

namespace App\Services;

use App\Models\ServiceApplication;
use App\Models\ServiceApplicationFile;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;

class ApplicationFileService
{
    public function storeFiles(
        ServiceApplication $application,
        array $files,
        ?User $user = null
    ): Collection {
        $storedFiles = collect();

        foreach ($files as $fieldName => $fileOrFiles) {
            $fileList = is_array($fileOrFiles) ? $fileOrFiles : [$fileOrFiles];

            foreach ($fileList as $file) {
                if (!$file instanceof UploadedFile) {
                    continue;
                }

                $path = $file->store('service-applications', 'public');

                $category = in_array((string) $fieldName, [
                    'workflow_documents',
                    'correction_documents',
                    'approval_documents',
                    'final_documents',
                    'certificate',
                    'documents',
                ], true)
                    ? ((string) $fieldName === 'documents' ? 'workflow_documents' : (string) $fieldName)
                    : 'application';

                $storedFiles->push(ServiceApplicationFile::create([
                    'application_id' => $application->id,
                    'field_name' => (string) $fieldName,
                    'original_name' => $file->getClientOriginalName(),
                    'stored_name' => basename($path),
                    'path' => $path,
                    'mime_type' => $file->getMimeType(),
                    'size' => $file->getSize(),
                    'uploaded_by' => $user?->id,
                    'file_category' => $category,
                    'verification_status' => 'pending',
                ]));
            }
        }

        return $storedFiles;
    }
}
