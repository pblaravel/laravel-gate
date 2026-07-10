<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class CreateTxRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'asset_gate' => 'required|string|exists:gates,name',
            'from_address' => 'required|string|exists:addresses,address',
            'to_address' => 'required|string',
            'amount' => 'required|string|regex:/^\d+(\.\d+)?$/',
        ];
    }
}
