import React from 'react';
import { FaFileExcel, FaFilePdf, FaFileCode, FaFile } from 'react-icons/fa';
import { saveAs } from 'file-saver';
import { utils, write } from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export type ExportFormat = 'csv' | 'excel' | 'pdf' | 'json';

export interface Column {
  key: string;
  header: string;
  format?: (value: any) => string;
  width?: number;
}

export interface ExportDataProps {
  data: Record<string, any>[];
  columns: Column[];
  filename: string;
  title?: string;
  subtitle?: string;
  showControls?: boolean;
  orientation?: 'portrait' | 'landscape';
  onExport?: (format: ExportFormat) => void;
}

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

const ExportData: React.FC<ExportDataProps> = ({
  data,
  columns,
  filename,
  title,
  subtitle,
  showControls = true,
  orientation = 'portrait',
  onExport
}) => {
  // Process data for export
  const processData = () => {
    return data.map(item => {
      const processed: Record<string, any> = {};
      
      columns.forEach(column => {
        const value = item[column.key];
        processed[column.header] = column.format ? column.format(value) : value;
      });
      
      return processed;
    });
  };

  // Export to CSV
  const exportCSV = () => {
    try {
      const processedData = processData();
      
      // Create CSV content
      const headers = columns.map(col => col.header).join(',');
      const rows = processedData.map(row => 
        columns.map(col => {
          const value = row[col.header];
          // Properly handle strings with commas and quotes
          return typeof value === 'string' 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        }).join(',')
      );
      
      const csvContent = `${headers}\n${rows.join('\n')}`;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, `${filename}.csv`);
      
      return true;
    } catch (error) {
      console.error('CSV Export Error:', error);
      return false;
    }
  };

  // Export to Excel
  const exportExcel = () => {
    try {
      const processedData = processData();
      
      // Create workbook
      const ws = utils.json_to_sheet(processedData);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'Data');
      
      // Set column widths
      const colWidths = columns.map(col => ({ wch: col.width || 15 }));
      ws['!cols'] = colWidths;
      
      // Generate Excel file
      const excelBuffer = write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `${filename}.xlsx`);
      
      return true;
    } catch (error) {
      console.error('Excel Export Error:', error);
      return false;
    }
  };

  // Export to PDF
  const exportPDF = () => {
    try {
      const processedData = processData();
      
      // Create PDF document
      const unit = 'pt';
      const size = orientation === 'portrait' ? 'a4' : 'a4';
      const doc = new jsPDF(orientation, unit, size);
      
      // Add title and subtitle
      if (title) {
        doc.setFontSize(16);
        doc.text(title, 40, 40);
      }
      
      if (subtitle) {
        doc.setFontSize(12);
        doc.text(subtitle, 40, 60);
      }
      
      // Prepare table data
      const tableHeaders = columns.map(col => col.header);
      const tableData = processedData.map(row => 
        columns.map(col => row[col.header])
      );
      
      // Generate table
      doc.autoTable({
        head: [tableHeaders],
        body: tableData,
        startY: title || subtitle ? 70 : 40,
        styles: {
          fontSize: 10,
          cellPadding: 5,
          overflow: 'linebreak'
        },
        columnStyles: columns.reduce((acc, col, index) => {
          if (col.width) {
            acc[index] = { cellWidth: col.width };
          }
          return acc;
        }, {} as Record<number, { cellWidth: number }>)
      });
      
      // Save PDF
      doc.save(`${filename}.pdf`);
      
      return true;
    } catch (error) {
      console.error('PDF Export Error:', error);
      return false;
    }
  };

  // Export to JSON
  const exportJSON = () => {
    try {
      // Create JSON content
      const jsonContent = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      saveAs(blob, `${filename}.json`);
      
      return true;
    } catch (error) {
      console.error('JSON Export Error:', error);
      return false;
    }
  };

  // Handle export selection
  const handleExport = (format: ExportFormat) => {
    if (onExport) {
      onExport(format);
      return;
    }
    
    let success = false;
    
    switch (format) {
      case 'csv':
        success = exportCSV();
        break;
      case 'excel':
        success = exportExcel();
        break;
      case 'pdf':
        success = exportPDF();
        break;
      case 'json':
        success = exportJSON();
        break;
    }
    
    if (!success) {
      alert(`Failed to export ${format.toUpperCase()} file. Please try again.`);
    }
  };

  if (!showControls) {
    return null;
  }

  return (
    <div className="flex space-x-2">
      <button
        onClick={() => handleExport('csv')}
        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        title="Export as CSV"
      >
        <FaFileExcel className="mr-2 text-green-600" />
        CSV
      </button>
      
      <button
        onClick={() => handleExport('excel')}
        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        title="Export as Excel"
      >
        <FaFileExcel className="mr-2 text-green-600" />
        Excel
      </button>
      
      <button
        onClick={() => handleExport('pdf')}
        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        title="Export as PDF"
      >
        <FaFilePdf className="mr-2 text-red-600" />
        PDF
      </button>
      
      <button
        onClick={() => handleExport('json')}
        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        title="Export as JSON"
      >
        <FaFileCode className="mr-2 text-blue-600" />
        JSON
      </button>
    </div>
  );
};

export default ExportData; 