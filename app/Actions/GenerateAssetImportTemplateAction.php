<?php

namespace App\Actions;

use App\Models\Location;
use OpenSpout\Common\Entity\Style\CellAlignment;
use OpenSpout\Common\Entity\Style\Color;
use OpenSpout\Common\Entity\Style\Style;
use Spatie\SimpleExcel\SimpleExcelWriter;

class GenerateAssetImportTemplateAction
{
    private const HEADERS = [
        'Kode Asset',
        'Brand',
        'Model',
        'Serial Number',
        'Part Number',
        'No SPB',
        'Nomor Dokumen',
        'PIC',
        'Kondisi',
        'Tanggal Pembelian',
        'Harga Pembelian',
        'Lokasi',
        'Department',
        'Status',
        'Vendor',
        'Catatan',
    ];

    public function __invoke(string $filePath): string
    {
        $headerStyle = (new Style)
            ->setFontBold()
            ->setFontColor(Color::WHITE)
            ->setBackgroundColor(Color::rgb(0, 128, 255))
            ->setCellAlignment(CellAlignment::CENTER);

        $writer = SimpleExcelWriter::create($filePath)
            ->nameCurrentSheet('Template Import Aset')
            ->setHeaderStyle($headerStyle)
            ->addHeader(self::HEADERS);

        $example = $this->exampleRow();

        if ($example !== null) {
            $writer->addRow($example);
        }

        $writer->close();

        return $filePath;
    }

    /** @return array<int, string>|null */
    private function exampleRow(): ?array
    {
        return [
            '01.01.01.01.001',
            'Otis',
            'Gen2',
            'SN-CONTOH-001',
            '',
            '',
            '',
            '',
            'Baik',
            date('Y-m-d'),
            '15000000',
            Location::query()->value('name') ?? '',
            '',
            'Aktif',
            '',
            'Hapus baris contoh ini sebelum mengimpor.',
        ];
    }
}
