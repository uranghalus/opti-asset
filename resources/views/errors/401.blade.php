<!DOCTYPE html>
<html lang="id">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Akses Ditolak — OptiAsset</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@400;500;600;700&family=Noto+Sans+Mono:wght@400&display=swap" rel="stylesheet">
        <style>
            body {
                font-family: 'Public Sans', sans-serif;
                background-color: #f8fafc;
                color: #0f172a;
            }
            .font-mono {
                font-family: 'Noto Sans Mono', monospace;
            }
        </style>
    </head>
    <body class="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4">
        <div class="max-w-md w-full text-center">
            <div class="bg-white rounded-xl shadow-sm border border-[#e2e8f0] p-8">
                <div class="flex justify-center mb-6">
                    <div class="w-12 h-12 rounded-full bg-[#2d82b7] flex items-center justify-center text-white text-2xl">
                        401
                    </div>
                </div>

                <h1 class="text-2xl font-semibold text-[#0f172a] mb-2">Akses Ditolak</h1>
                <p class="text-[#475569] mb-6">
                    Anda tidak memiliki akses ke halaman ini. Silakan login kembali atau hubungi administrator.
                </p>

                @if(session('saml.tenant'))
                    <div class="mb-6 p-4 rounded-lg bg-[#e2e8f0] border border-[#cbd5e1] text-left text-sm">
                        <span class="font-mono text-[#475569]">{{ session('saml.tenant')->code }}</span>
                    </div>
                @endif

                <div class="space-y-3">
                    @if(session('saml.tenant') && session('saml.tenant')->code)
                        <a href="{{ route('tenant.dashboard', ['tenant' => session('saml.tenant')->code]) }}"
                           class="w-full btn bg-[#2d82b7] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#256ea2] transition-colors">
                            Kembali ke Dashboard
                        </a>
                    @else
                        <a href="{{ route('home') }}"
                           class="w-full btn bg-[#2d82b7] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#256ea2] transition-colors">
                            Kembali ke Beranda
                        </a>
                    @endif
                    <a href="/login"
                       class="w-full btn border border-[#cbd5e1] text-[#475569] px-6 py-3 rounded-lg font-medium hover:bg-[#f1f5f9] transition-colors">
                        Login Ulang
                    </a>
                    <a href="mailto:it@tataoptima.com"
                       class="w-full btn border border-[#cbd5e1] text-[#475569] px-6 py-3 rounded-lg font-medium hover:bg-[#f1f5f9] transition-colors">
                        Hubungi Administrator
                    </a>
                </div>
            </div>
        </div>
    </body>
</html>
