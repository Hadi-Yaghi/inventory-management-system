package com.project.code.Service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import com.project.code.Model.OrderDetails;
import com.project.code.Model.OrderItem;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

@Service
public class PdfInvoiceService {

    public byte[] generateInvoicePdf(OrderDetails order) {
        Document document = new Document(PageSize.A4);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Font styles
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, Font.BOLD);
            Font subTitleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Font.BOLD);
            Font regularFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
            Font boldFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);

            // Title
            Paragraph title = new Paragraph("INVOICE", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            document.add(title);
            document.add(new Paragraph(" "));

            // Store & Order Meta info
            Paragraph meta = new Paragraph();
            meta.add(new Chunk("Invoice ID: ", boldFont));
            meta.add(new Chunk(String.valueOf(order.getId()) + "\n", regularFont));
            meta.add(new Chunk("Date: ", boldFont));
            meta.add(new Chunk(order.getDate().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) + "\n", regularFont));
            meta.add(new Chunk("Store: ", boldFont));
            meta.add(new Chunk(order.getStore().getName() + " (" + order.getStore().getAddress() + ")\n", regularFont));
            document.add(meta);
            document.add(new Paragraph(" "));

            // Customer Info
            Paragraph customerInfo = new Paragraph();
            customerInfo.add(new Chunk("Customer Information:\n", subTitleFont));
            customerInfo.add(new Chunk("Name: ", boldFont));
            customerInfo.add(new Chunk(order.getCustomer().getName() + "\n", regularFont));
            customerInfo.add(new Chunk("Email: ", boldFont));
            customerInfo.add(new Chunk(order.getCustomer().getEmail() + "\n", regularFont));
            customerInfo.add(new Chunk("Phone: ", boldFont));
            customerInfo.add(new Chunk((order.getCustomer().getPhone() != null ? order.getCustomer().getPhone() : "-") + "\n", regularFont));
            document.add(customerInfo);
            document.add(new Paragraph(" "));

            // Line Items Table
            PdfPTable table = new PdfPTable(5);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{30, 20, 15, 15, 20});

            // Table Headers
            String[] headers = {"Product", "SKU", "Price", "Qty", "Total"};
            for (String header : headers) {
                PdfPCell cell = new PdfPCell(new Paragraph(header, boldFont));
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setGrayFill(0.85f);
                table.addCell(cell);
            }

            // Table Data
            if (order.getOrderItems() != null) {
                for (OrderItem item : order.getOrderItems()) {
                    table.addCell(new PdfPCell(new Paragraph(item.getProduct().getName(), regularFont)));
                    table.addCell(new PdfPCell(new Paragraph(item.getProduct().getSku(), regularFont)));
                    table.addCell(new PdfPCell(new Paragraph(String.format("$%.2f", item.getProduct().getPrice()), regularFont)));
                    table.addCell(new PdfPCell(new Paragraph(String.valueOf(item.getQuantity()), regularFont)));
                    table.addCell(new PdfPCell(new Paragraph(String.format("$%.2f", item.getPrice()), regularFont)));
                }
            }

            document.add(table);
            document.add(new Paragraph(" "));

            // Total Amount
            Paragraph total = new Paragraph();
            total.setAlignment(Element.ALIGN_RIGHT);
            total.add(new Chunk("Total Price: ", boldFont));
            total.add(new Chunk(String.format("$%.2f", order.getTotalPrice()), titleFont));
            document.add(total);

            document.close();
        } catch (DocumentException e) {
            e.printStackTrace();
        }

        return out.toByteArray();
    }
}
