package com.project.code.Controller;

import com.project.code.Model.Notification;
import com.project.code.Service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/notifications")
@Tag(name = "Notification Controller", description = "Endpoints for user notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping
    @Operation(summary = "Get user notifications", description = "Get list of notifications relevant to the authenticated user's stores or recipient ID.")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved notifications")
    public ResponseEntity<List<Notification>> getNotifications() {
        return ResponseEntity.ok(notificationService.getUserNotifications());
    }

    @PutMapping("/{id}/read")
    @Operation(summary = "Mark notification as read", description = "Update isRead status of a notification to true.")
    @ApiResponse(responseCode = "200", description = "Notification marked as read successfully")
    public ResponseEntity<Map<String, String>> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Notification marked as read");
        return ResponseEntity.ok(response);
    }
}
