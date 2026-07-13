package com.project.code.Service;

import com.project.code.Model.OrderDetails;
import com.project.code.Model.ReturnRequest;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${app.manager.emails:manager@example.com}")
    private String managerEmails;

    @Value("${spring.mail.username:noreply@example.com}")
    private String fromEmail;

    public void sendOrderConfirmation(OrderDetails order, byte[] pdfBytes) {
        if (mailSender == null) {
            System.out.println("SMTP is not configured. Order confirmation email simulation for " + order.getCustomer().getEmail());
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setFrom(fromEmail);
            helper.setTo(order.getCustomer().getEmail());
            helper.setSubject("Order Confirmation - Invoice #" + order.getId());
            helper.setText("Dear " + order.getCustomer().getName() + ",\n\n" +
                    "Thank you for your order! Please find attached your invoice PDF.\n\n" +
                    "Best regards,\n" +
                    order.getStore().getName());

            helper.addAttachment("Invoice_" + order.getId() + ".pdf", new ByteArrayResource(pdfBytes));

            mailSender.send(message);
            System.out.println("Order confirmation email successfully sent to " + order.getCustomer().getEmail());
        } catch (Exception e) {
            System.err.println("Failed to send order confirmation email: " + e.getMessage());
        }
    }

    public void sendLowStockAlert(String storeName, String alertDetails) {
        if (mailSender == null) {
            System.out.println("SMTP is not configured. Low stock email simulation for store: " + storeName);
            System.out.println("Alert details:\n" + alertDetails);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false);

            helper.setFrom(fromEmail);
            helper.setTo(managerEmails.split(","));
            helper.setSubject("LOW STOCK ALERT - " + storeName);
            helper.setText("The following items are running low in stock at " + storeName + ":\n\n" + alertDetails);

            mailSender.send(message);
            System.out.println("Low stock alert email successfully sent to " + managerEmails);
        } catch (Exception e) {
            System.err.println("Failed to send low stock alert email: " + e.getMessage());
        }
    }

    public void sendReturnStatusEmail(ReturnRequest request, String customerEmail) {
        if (mailSender == null) {
            System.out.println("SMTP is not configured. Return request status email simulation for " + customerEmail);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false);

            helper.setFrom(fromEmail);
            helper.setTo(customerEmail);
            helper.setSubject("Return Request Update - Request #" + request.getId());
            helper.setText("Dear Customer,\n\n" +
                    "Your return request for item #" + request.getOrderItemId() + " has been updated to: " + request.getStatus() + ".\n\n" +
                    "Thank you,\n" +
                    "Support Team");

            mailSender.send(message);
            System.out.println("Return status email successfully sent to " + customerEmail);
        } catch (Exception e) {
            System.err.println("Failed to send return status email: " + e.getMessage());
        }
    }
}
