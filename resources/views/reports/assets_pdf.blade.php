@php
use Illuminate\Support\Number;
use App\Enums\AssetStatus;
@endphp
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Laporan Daftar Aset</title>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 10pt;
            color: #111;
            margin: 0 2cm;
        }
        h1 {
            font-size: 18pt;
            text-align: center;
            margin: 1em 0;
            color: #333;
        }
        h2 {
            font-size: 12pt;
            margin: 1em 0 0.5em;
            color: #555;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 0.5em;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 6px 8px;
            text-align: left;
            font-size: 8pt;
        }
        th {
            background-color: #f5f5f5;
            font-weight: bold;
        }
        tr:nth-child(even) {
            background-color: #fafafa;
        }
        .text-right {
            text-align: right;
        }
        .text-center {
            text-align: center;
        }
        .page-break {
            page-break-after: always;
        }
    </style>
</head>
<body>
    <h1>Laporan Daftar Aset</h1>
    
    <p>Tanggal cetak: {{ now()->format('d F Y') }}</p>
    
    <h2>Daftar Aset ({{ $assets->count() ?? $assets->total() ?? 0 }} item)</h2>
    
    <table>
        <thead>
            <tr>
                <th>Kode</th>
                <th>Item</th>
                <th>Brand/Model</th>
                <th>Serial</th>
                <th>Status</th>
                <th>Kondisi</th>
                <th>Lokasi</th>
                <th>Dept</th>
                <th>Tgl Beli</th>
                <th>Harga</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($assets as $asset)
                <tr>
                    <td>{{ $asset->kode_asset ?? '-' }}</td>
                    <td>{{ $asset->item->code ?? '' }} - {{ $asset->item->name ?? '-' }}</td>
                    <td>{{ $asset->brand ?? '' }}/{{ $asset->model ?? '' }}</td>
                    <td>{{ $asset->serial_number ?? '-' }}</td>
                    <td>{{ $asset->status->label() ?? $asset->status ?? '-' }}</td>
                    <td>{{ $asset->condition ?? '-' }}</td>
                    <td>{{ $asset->location->name ?? '-' }}</td>
                    <td>{{ $asset->department->nama_department ?? '-' }}</td>
                    <td class="text-right">{{ $asset->purchase_date?->format('d/m/Y') ?? '-' }}</td>
                    <td class="text-right">@if($asset->purchase_price) Rp {{ Number::format($asset->purchase_price) }} @else - @endif</td>
                </tr>
            @endforeach
            @if ($assets->isEmpty())
                <tr>
                    <td colspan="10" class="text-center">Tidak ada data</td>
                </tr>
            @endif
        </tbody>
    </table>
    
    @if(isset($assets->lastPage) && $assets->hasPages())
        <div style="margin-top: 1em; font-size: 9pt;">
            Halaman {{ $assets->currentPage() }} dari {{ $assets->lastPage }}
        </div>
    @endif
</body>
</html>
