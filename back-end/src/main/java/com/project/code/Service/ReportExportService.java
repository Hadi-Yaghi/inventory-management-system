package com.project.code.Service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.project.code.Model.Customer;
import com.project.code.Model.Inventory;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.List;

/**
 * Builds exportable reports in Excel (XLSX), CSV, and PDF formats
 * for inventory, sales, and customer data.
 */
@Service
public class ReportExportService {

    // ═══════════════════════════════════════════════════════════════════════
    // INVENTORY REPORTS
    // ═══════════════════════════════════════════════════════════════════════

    public byte[] exportInventoryExcel(List<Inventory> inventoryList) throws Exception {
        XSSFWorkbook workbook = new XSSFWorkbook();
        org.apache.poi.ss.usermodel.Sheet sheet = workbook.createSheet("Inventory");

        org.apache.poi.ss.usermodel.CellStyle headerStyle = workbook.createCellStyle();
        org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerStyle.setFont(headerFont);

        org.apache.poi.ss.usermodel.Row header = sheet.createRow(0);
        String[] cols = {"ID", "Product", "SKU", "Store", "Stock Level", "Low Stock Threshold"};
        for (int i = 0; i < cols.length; i++) {
            org.apache.poi.ss.usermodel.Cell cell = header.createCell(i);
            cell.setCellValue(cols[i]);
            cell.setCellStyle(headerStyle);
        }

        int rowIdx = 1;
        for (Inventory inv : inventoryList) {
            org.apache.poi.ss.usermodel.Row row = sheet.createRow(rowIdx++);
            row.createCell(0).setCellValue(inv.getId());
            row.createCell(1).setCellValue(inv.getProduct() != null ? inv.getProduct().getName() : "");
            row.createCell(2).setCellValue(inv.getProduct() != null ? inv.getProduct().getSku() : "");
            row.createCell(3).setCellValue(inv.getStore() != null ? inv.getStore().getName() : "");
            row.createCell(4).setCellValue(inv.getStockLevel() != null ? inv.getStockLevel() : 0);
            row.createCell(5).setCellValue(inv.getLowStockThreshold() != null ? inv.getLowStockThreshold() : 0);
        }

        for (int i = 0; i < cols.length; i++) sheet.autoSizeColumn(i);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        workbook.write(out);
        workbook.close();
        return out.toByteArray();
    }

    public byte[] exportInventoryCsv(List<Inventory> inventoryList) {
        StringWriter sw = new StringWriter();
        PrintWriter pw = new PrintWriter(sw);
        pw.println("ID,Product,SKU,Store,StockLevel,LowStockThreshold");
        for (Inventory inv : inventoryList) {
            pw.printf("%d,\"%s\",\"%s\",\"%s\",%d,%d%n",
                    inv.getId(),
                    inv.getProduct() != null ? inv.getProduct().getName() : "",
                    inv.getProduct() != null ? inv.getProduct().getSku() : "",
                    inv.getStore() != null ? inv.getStore().getName() : "",
                    inv.getStockLevel() != null ? inv.getStockLevel() : 0,
                    inv.getLowStockThreshold() != null ? inv.getLowStockThreshold() : 0);
        }
        pw.flush();
        return sw.toString().getBytes();
    }

    public byte[] exportInventoryPdf(List<Inventory> inventoryList) {
        Document document = new Document(PageSize.A4.rotate());
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try {
            PdfWriter.getInstance(document, out);
            document.open();
            document.add(new Paragraph("Inventory Report", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18)));
            document.add(new Paragraph(" "));

            PdfPTable table = new PdfPTable(6);
            table.setWidthPercentage(100);
            String[] headers = {"ID", "Product", "SKU", "Store", "Stock Level", "Threshold"};
            for (String h : headers) {
                PdfPCell cell = new PdfPCell(new Paragraph(h, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10)));
                cell.setGrayFill(0.85f);
                table.addCell(cell);
            }
            for (Inventory inv : inventoryList) {
                table.addCell(String.valueOf(inv.getId()));
                table.addCell(inv.getProduct() != null ? inv.getProduct().getName() : "");
                table.addCell(inv.getProduct() != null ? inv.getProduct().getSku() : "");
                table.addCell(inv.getStore() != null ? inv.getStore().getName() : "");
                table.addCell(String.valueOf(inv.getStockLevel() != null ? inv.getStockLevel() : 0));
                table.addCell(String.valueOf(inv.getLowStockThreshold() != null ? inv.getLowStockThreshold() : 0));
            }
            document.add(table);
            document.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return out.toByteArray();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SALES REPORTS
    // ═══════════════════════════════════════════════════════════════════════

    public byte[] exportSalesExcel(List<Object[]> topByQty, List<Object[]> topByRev, Double totalRevenue) throws Exception {
        XSSFWorkbook workbook = new XSSFWorkbook();

        // Sheet 1: Top by Quantity
        org.apache.poi.ss.usermodel.Sheet sheet1 = workbook.createSheet("Top Selling by Quantity");
        org.apache.poi.ss.usermodel.CellStyle headerStyle = workbook.createCellStyle();
        org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerStyle.setFont(headerFont);

        org.apache.poi.ss.usermodel.Row h1 = sheet1.createRow(0);
        h1.createCell(0).setCellValue("Product ID"); h1.getCell(0).setCellStyle(headerStyle);
        h1.createCell(1).setCellValue("Product Name"); h1.getCell(1).setCellStyle(headerStyle);
        h1.createCell(2).setCellValue("Total Quantity Sold"); h1.getCell(2).setCellStyle(headerStyle);

        int r = 1;
        for (Object[] row : topByQty) {
            org.apache.poi.ss.usermodel.Row dataRow = sheet1.createRow(r++);
            dataRow.createCell(0).setCellValue(String.valueOf(row[0]));
            dataRow.createCell(1).setCellValue(String.valueOf(row[1]));
            dataRow.createCell(2).setCellValue(((Number) row[2]).doubleValue());
        }
        for (int i = 0; i < 3; i++) sheet1.autoSizeColumn(i);

        // Sheet 2: Top by Revenue
        org.apache.poi.ss.usermodel.Sheet sheet2 = workbook.createSheet("Top Selling by Revenue");
        org.apache.poi.ss.usermodel.Row h2 = sheet2.createRow(0);
        h2.createCell(0).setCellValue("Product ID"); h2.getCell(0).setCellStyle(headerStyle);
        h2.createCell(1).setCellValue("Product Name"); h2.getCell(1).setCellStyle(headerStyle);
        h2.createCell(2).setCellValue("Total Revenue"); h2.getCell(2).setCellStyle(headerStyle);

        r = 1;
        for (Object[] row : topByRev) {
            org.apache.poi.ss.usermodel.Row dataRow = sheet2.createRow(r++);
            dataRow.createCell(0).setCellValue(String.valueOf(row[0]));
            dataRow.createCell(1).setCellValue(String.valueOf(row[1]));
            dataRow.createCell(2).setCellValue(((Number) row[2]).doubleValue());
        }
        for (int i = 0; i < 3; i++) sheet2.autoSizeColumn(i);

        // Summary row on sheet2
        org.apache.poi.ss.usermodel.Row summaryRow = sheet2.createRow(r + 1);
        summaryRow.createCell(1).setCellValue("TOTAL REVENUE:");
        summaryRow.getCell(1).setCellStyle(headerStyle);
        summaryRow.createCell(2).setCellValue(totalRevenue != null ? totalRevenue : 0.0);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        workbook.write(out);
        workbook.close();
        return out.toByteArray();
    }

    public byte[] exportSalesCsv(List<Object[]> topByQty, List<Object[]> topByRev) {
        StringWriter sw = new StringWriter();
        PrintWriter pw = new PrintWriter(sw);
        pw.println("Section: Top Selling by Quantity");
        pw.println("ProductID,ProductName,TotalQuantity");
        for (Object[] row : topByQty) {
            pw.printf("%s,\"%s\",%s%n", row[0], row[1], row[2]);
        }
        pw.println();
        pw.println("Section: Top Selling by Revenue");
        pw.println("ProductID,ProductName,TotalRevenue");
        for (Object[] row : topByRev) {
            pw.printf("%s,\"%s\",%s%n", row[0], row[1], row[2]);
        }
        pw.flush();
        return sw.toString().getBytes();
    }

    public byte[] exportSalesPdf(List<Object[]> topByQty, List<Object[]> topByRev, Double totalRevenue) {
        Document document = new Document(PageSize.A4);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try {
            PdfWriter.getInstance(document, out);
            document.open();
            document.add(new Paragraph("Sales Report", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18)));
            document.add(new Paragraph(" "));

            document.add(new Paragraph("Top Selling Products by Quantity", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12)));
            PdfPTable t1 = new PdfPTable(3);
            t1.setWidthPercentage(100);
            for (String h : new String[]{"Product ID", "Product Name", "Total Qty"}) {
                PdfPCell cell = new PdfPCell(new Paragraph(h, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10)));
                cell.setGrayFill(0.85f);
                t1.addCell(cell);
            }
            for (Object[] row : topByQty) {
                t1.addCell(String.valueOf(row[0]));
                t1.addCell(String.valueOf(row[1]));
                t1.addCell(String.valueOf(row[2]));
            }
            document.add(t1);
            document.add(new Paragraph(" "));

            document.add(new Paragraph("Top Selling Products by Revenue", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12)));
            PdfPTable t2 = new PdfPTable(3);
            t2.setWidthPercentage(100);
            for (String h : new String[]{"Product ID", "Product Name", "Total Revenue"}) {
                PdfPCell cell = new PdfPCell(new Paragraph(h, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10)));
                cell.setGrayFill(0.85f);
                t2.addCell(cell);
            }
            for (Object[] row : topByRev) {
                t2.addCell(String.valueOf(row[0]));
                t2.addCell(String.valueOf(row[1]));
                t2.addCell(String.valueOf(row[2]));
            }
            document.add(t2);
            document.add(new Paragraph(" "));

            document.add(new Paragraph("Total Revenue: $" + (totalRevenue != null ? String.format("%.2f", totalRevenue) : "0.00"),
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14)));

            document.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return out.toByteArray();
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CUSTOMER REPORTS
    // ═══════════════════════════════════════════════════════════════════════

    public byte[] exportCustomersExcel(List<Customer> customers) throws Exception {
        XSSFWorkbook workbook = new XSSFWorkbook();
        org.apache.poi.ss.usermodel.Sheet sheet = workbook.createSheet("Customers");

        org.apache.poi.ss.usermodel.CellStyle headerStyle = workbook.createCellStyle();
        org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerStyle.setFont(headerFont);

        org.apache.poi.ss.usermodel.Row header = sheet.createRow(0);
        String[] cols = {"ID", "Name", "Email", "Phone"};
        for (int i = 0; i < cols.length; i++) {
            org.apache.poi.ss.usermodel.Cell cell = header.createCell(i);
            cell.setCellValue(cols[i]);
            cell.setCellStyle(headerStyle);
        }

        int rowIdx = 1;
        for (Customer c : customers) {
            org.apache.poi.ss.usermodel.Row row = sheet.createRow(rowIdx++);
            row.createCell(0).setCellValue(c.getId());
            row.createCell(1).setCellValue(c.getName() != null ? c.getName() : "");
            row.createCell(2).setCellValue(c.getEmail() != null ? c.getEmail() : "");
            row.createCell(3).setCellValue(c.getPhone() != null ? c.getPhone() : "");
        }
        for (int i = 0; i < cols.length; i++) sheet.autoSizeColumn(i);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        workbook.write(out);
        workbook.close();
        return out.toByteArray();
    }

    public byte[] exportCustomersCsv(List<Customer> customers) {
        StringWriter sw = new StringWriter();
        PrintWriter pw = new PrintWriter(sw);
        pw.println("ID,Name,Email,Phone");
        for (Customer c : customers) {
            pw.printf("%d,\"%s\",\"%s\",\"%s\"%n",
                    c.getId(),
                    c.getName() != null ? c.getName() : "",
                    c.getEmail() != null ? c.getEmail() : "",
                    c.getPhone() != null ? c.getPhone() : "");
        }
        pw.flush();
        return sw.toString().getBytes();
    }

    public byte[] exportCustomersPdf(List<Customer> customers) {
        Document document = new Document(PageSize.A4);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try {
            PdfWriter.getInstance(document, out);
            document.open();
            document.add(new Paragraph("Customer Report", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18)));
            document.add(new Paragraph(" "));

            PdfPTable table = new PdfPTable(4);
            table.setWidthPercentage(100);
            for (String h : new String[]{"ID", "Name", "Email", "Phone"}) {
                PdfPCell cell = new PdfPCell(new Paragraph(h, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10)));
                cell.setGrayFill(0.85f);
                table.addCell(cell);
            }
            for (Customer c : customers) {
                table.addCell(String.valueOf(c.getId()));
                table.addCell(c.getName() != null ? c.getName() : "");
                table.addCell(c.getEmail() != null ? c.getEmail() : "");
                table.addCell(c.getPhone() != null ? c.getPhone() : "");
            }
            document.add(table);
            document.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return out.toByteArray();
    }
}
