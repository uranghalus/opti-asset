<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Laporan Mutasi Aset</title>
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
    <h1>Laporan Mutasi Aset</h1>
    <p class="meta">Dicetak: {{ now()->format('d M Y H:i') }}</p>

    <table>
        <thead>
            <tr>
                <th>No</th>
                <th>Tanggal</th>
                <th>Kode Aset</th>
                <th>Dari</th>
                <th>Ke</th>
                <th>Pemohon</th>
                <th>Status</th>
                <th>Tgl Disetujui</th>
                <th>Penyetuju</th>
            </tr>
        </thead>
        <tbody>
            @forelse($transfers as $i => $t)
                <tr>
                    <td>{{ $i + 1 }}</td>
                    <td>{{ $t->created_at->format('d/m/Y') }}</td>
                    <td>{{ $t->asset->kode_asset ?? '—' }}</td>
                    <td>{{ $t->fromLocation->name ?? '—' }}</td>
                    <td>{{ $t->toLocation->name ?? '—' }}</td>
                    <td>{{ $t->requester->name ?? '—' }}</td>
                    <td>{{ $t->status->value }}</td>
                    <td>{{ $t->approved_at?->format('d/m/Y H:i') ?? '—' }}</td>
                    <td>{{ $t->approver->name ?? '—' }}</td>
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
