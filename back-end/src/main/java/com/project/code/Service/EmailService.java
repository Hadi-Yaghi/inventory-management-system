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

    public void sendInvitationEmail(String recipientEmail, String organizationName, String role, String token) {
        String frontendBaseUrl = System.getenv("APP_FRONTEND_URL");
        if (frontendBaseUrl == null || frontendBaseUrl.isBlank()) {
            frontendBaseUrl = "http://localhost:5173";
        } else {
            frontendBaseUrl = frontendBaseUrl.split(",")[0];
        }
        String signupUrl = frontendBaseUrl + "/signup?token=" + token;

        if (mailSender == null) {
            System.out.println("SMTP is not configured. Invitation email link for " + recipientEmail + ": " + signupUrl);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(recipientEmail);
            helper.setSubject("Invitation to join " + organizationName);
            
            String html = "<div style='font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #334155; background-color: #0f172a; color: #f8fafc; border-radius: 12px;'>"
                    + "<h2 style='color: #6366f1;'>Workspace Invitation</h2>"
                    + "<p>You have been invited to join <strong>" + organizationName + "</strong> as a <strong>" + role + "</strong>.</p>"
                    + "<p>Click the button below to accept your invitation and complete your account setup:</p>"
                    + "<p style='margin: 25px 0;'><a href='" + signupUrl + "' style='background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;'>Accept Invitation & Sign Up</a></p>"
                    + "<p style='color: #94a3b8; font-size: 12px;'>Or copy and paste this link in your browser:<br/><a href='" + signupUrl + "' style='color: #818cf8;'>" + signupUrl + "</a></p>"
                    + "</div>";

            helper.setText(html, true);
            mailSender.send(message);
            System.out.println("Invitation email successfully sent to " + recipientEmail);
        } catch (Exception e) {
            System.err.println("Failed to send invitation email to " + recipientEmail + ": " + e.getMessage());
        }
    }

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
