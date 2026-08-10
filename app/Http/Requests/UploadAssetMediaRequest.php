<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadAssetMediaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            // max:1024 = 1 MB — foto dikompres di sisi klien sebelum diunggah,
            // dokumen tidak bisa dikompres sehingga dibatasi di sini.
            'file' => ['required', 'file', 'mimes:jpeg,jpg,png,webp,gif,pdf,doc,docx,xls,xlsx,csv,txt', 'max:1024'],
        ];
    }
}
