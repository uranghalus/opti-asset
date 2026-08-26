<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Laporan Disposal Aset</title>
    <style>
        body { font-family: sans-serif; font-size: 12px; color: #333; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        .meta { font-size: 11px; color: #666; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; font-size: 11px; }
        th { background: #f0f0f0; font-weight: 600; }
        tr:nth-child(even) { background: #fafafa; }
    </style>
</head>
<body>
    <h1>Laporan Disposal Aset</h1>
    <p class="meta">Dicetak: {{ now()->format('d M Y H:i') }}</p>

    <table>
        <thead>
            <tr>
                <th>No</th>
                <th>Tanggal</th>
                <th>Kode Aset</th>
                <th>Serial Number</th>
                <th>Item</th>
                <th>Alasan</th>
                <th>Tgl Disposal</th>
                <th>Status</th>
                <th>Disposal Oleh</th>
            </tr>
        </thead>
        <tbody>
            @forelse($disposals as $i => $d)
                <tr>
                    <td>{{ $i + 1 }}</td>
                    <td>{{ $d->created_at->format('d/m/Y') }}</td>
                    <td>{{ $d->asset->kode_asset ?? '—' }}</td>
                    <td>{{ $d->asset->serial_number ?? '—' }}</td>
                    <td>{{ $d->asset->item->name ?? '—' }}</td>
                    <td>{{ $d->reason ?? '—' }}</td>
                    <td>{{ $d->disposal_date?->format('d/m/Y') ?? '—' }}</td>
                    <td>{{ $d->status->value }}</td>
                    <td>{{ $d->disposedBy->name ?? '—' }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="9" style="text-align:center;">Tidak ada data</td>
                </tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>
