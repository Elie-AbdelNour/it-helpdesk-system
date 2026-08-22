<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    private const ALLOWED_KEYS = ['email_notifications_enabled'];

    public function index()
    {
        return Setting::whereIn('settingkey', self::ALLOWED_KEYS)
            ->get()
            ->pluck('settingvalue', 'settingkey');
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'key' => ['required', 'string', 'in:'.implode(',', self::ALLOWED_KEYS)],
            'value' => ['required', 'string', 'max:255'],
        ]);

        Setting::updateOrCreate(
            ['settingkey' => $validated['key']],
            ['settingvalue' => $validated['value']],
        );

        return response()->json(['key' => $validated['key'], 'value' => $validated['value']]);
    }
}
