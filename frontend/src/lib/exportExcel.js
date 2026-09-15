import ExcelJS from 'exceljs';

/**
 * Generates and downloads a beautifully styled .xlsx Excel spreadsheet for Petite Girl Nails bookings.
 * @param {Array} bookings 
 * @param {string} filterDate - Optional date label
 */
export async function downloadStyledExcel(bookings, filterDate = '') {
  if (!bookings || bookings.length === 0) {
    alert('Belum ada data booking untuk di-export.');
    return;
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Petite Girl Nails Admin Portal';
  workbook.lastModifiedBy = 'Admin';
  workbook.created = new Date();
  workbook.modified = new Date();

  const sheet = workbook.addWorksheet('Rekap Booking', {
    pageSetup: { 
      paperSize: 9, // A4
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0
    },
    views: [{ showGridLines: true }]
  });

  // 1. BRAND HEADER BANNER (Row 1)
  sheet.mergeCells('A1:J1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = '💅 PETITE GIRL NAILS — REKAP JANJI TEMU & BOOKING STUDIO';
  titleCell.font = { 
    name: 'Segoe UI', 
    size: 15, 
    bold: true, 
    color: { argb: 'FFFFFFFF' } 
  };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF51485B' } // Studio brand plum
  };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.getRow(1).height = 42;

  // 2. SUBTITLE & METADATA BANNER (Row 2)
  sheet.mergeCells('A2:J2');
  const subtitleCell = sheet.getCell('A2');
  const nowStr = new Date().toLocaleString('id-ID', { 
    dateStyle: 'full', 
    timeStyle: 'short' 
  });
  subtitleCell.value = `📍 Studio: Sewon, Bantul, D.I. Yogyakarta | 📅 Dicetak: ${nowStr} | 📊 Total Data: ${bookings.length} Booking`;
  subtitleCell.font = { 
    name: 'Segoe UI', 
    size: 10, 
    italic: true, 
    color: { argb: 'FF444444' } 
  };
  subtitleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF5F2EC' } // Warm cream accent
  };
  subtitleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.getRow(2).height = 24;

  // 3. BLANK SEPARATOR (Row 3)
  sheet.addRow([]);
  sheet.getRow(3).height = 10;

  // 4. TABLE HEADERS (Row 4)
  const headers = [
    'No',
    'Kode Booking',
    'Nama Pelanggan',
    'WhatsApp',
    'Tanggal Booking',
    'Jam Slot',
    'Layanan Kuku',
    'Desain Inspo',
    'Catatan Khusus',
    'Status'
  ];
  const headerRow = sheet.addRow(headers);
  headerRow.height = 30;

  headerRow.eachCell((cell) => {
    cell.font = { 
      name: 'Segoe UI', 
      size: 10.5, 
      bold: true, 
      color: { argb: 'FFFFFFFF' } 
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF685D75' } // Plum medium
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF3D3545' } },
      bottom: { style: 'medium', color: { argb: 'FF3D3545' } },
      left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
      right: { style: 'thin', color: { argb: 'FFDDDDDD' } }
    };
  });

  // 5. DATA ROWS
  bookings.forEach((b, index) => {
    const servicesText = Array.isArray(b.services) ? b.services.join(', ') : (b.services || '-');
    const waClean = (b.whatsapp || '').toString();
    
    const row = sheet.addRow([
      index + 1,
      b.booking_code || '-',
      b.name || '-',
      waClean,
      b.appointment_date || '-',
      b.appointment_time ? `${b.appointment_time} WIB` : '-',
      servicesText,
      b.design_inspo || '-',
      b.notes || '-',
      (b.status || 'PENDING').toUpperCase()
    ]);
    row.height = 26;

    // Zebra stripes: alternate white and light pastel tint
    const isEven = index % 2 === 0;
    const bgArgb = isEven ? 'FFFFFFFF' : 'FFFBF9F5';

    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Segoe UI', size: 9.5 };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E5E5' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E5E5' } },
        left: { style: 'thin', color: { argb: 'FFE5E5E5' } },
        right: { style: 'thin', color: { argb: 'FFE5E5E5' } }
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bgArgb }
      };

      // Alignment rules
      // 1: No, 2: Code, 4: WA, 5: Date, 6: Time, 10: Status -> Center
      if ([1, 2, 4, 5, 6, 10].includes(colNumber)) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      }

      // WhatsApp format: Explicitly store as string so Excel doesn't drop leading zeros
      if (colNumber === 4) {
        cell.numFmt = '@'; // Text format
      }

      // Status Badge Styling
      if (colNumber === 10) {
        const st = (cell.value || '').toString().toUpperCase();
        cell.font = { name: 'Segoe UI', size: 9.5, bold: true };
        if (st === 'CONFIRMED') {
          cell.font.color = { argb: 'FF166534' }; // Deep Green
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFDCFCE7' } // Light Green
          };
        } else if (st === 'PENDING') {
          cell.font.color = { argb: 'FF854D0E' }; // Warm Brown/Yellow
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFEF9C3' } // Light Yellow
          };
        } else if (st === 'COMPLETED') {
          cell.font.color = { argb: 'FF1E40AF' }; // Deep Blue
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFDBEAFE' } // Light Blue
          };
        } else if (st === 'CANCELLED') {
          cell.font.color = { argb: 'FF991B1B' }; // Deep Red
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFEE2E2' } // Light Red
          };
        }
      }
    });
  });

  // 6. TOTAL / SUMMARY ROW (At bottom)
  const summaryRowIndex = sheet.rowCount + 1;
  sheet.mergeCells(`A${summaryRowIndex}:I${summaryRowIndex}`);
  const summaryLabel = sheet.getCell(`A${summaryRowIndex}`);
  summaryLabel.value = `JUMLAH TOTAL JANJI TEMU: ${bookings.length} KLIEN`;
  summaryLabel.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF51485B' } };
  summaryLabel.alignment = { vertical: 'middle', horizontal: 'right' };

  const summaryCountCell = sheet.getCell(`J${summaryRowIndex}`);
  summaryCountCell.value = bookings.length;
  summaryCountCell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FF51485B' } };
  summaryCountCell.alignment = { vertical: 'middle', horizontal: 'center' };

  [summaryLabel, summaryCountCell].forEach(c => {
    c.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF0EBF5' }
    };
    c.border = {
      top: { style: 'medium', color: { argb: 'FF51485B' } },
      bottom: { style: 'medium', color: { argb: 'FF51485B' } }
    };
  });
  sheet.getRow(summaryRowIndex).height = 28;

  // 7. COLUMN WIDTHS (Tailored to fit standard text without clipping)
  sheet.columns = [
    { key: 'no', width: 6 },
    { key: 'code', width: 16 },
    { key: 'name', width: 25 },
    { key: 'wa', width: 18 },
    { key: 'date', width: 16 },
    { key: 'time', width: 14 },
    { key: 'services', width: 36 },
    { key: 'inspo', width: 22 },
    { key: 'notes', width: 28 },
    { key: 'status', width: 16 }
  ];

  // 8. GENERATE BLOB & TRIGGER DOWNLOAD
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  const dateTag = filterDate || new Date().toISOString().slice(0, 10);
  anchor.download = `Rekap-Booking-PetiteGirlNails-${dateTag}.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}
