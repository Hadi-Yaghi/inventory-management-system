package com.project.code.Controller;

import com.project.code.Model.ActivityLog;
import com.project.code.Repo.ActivityLogRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/admin/activity-logs")
@Tag(name = "Activity Log Controller", description = "Endpoints for viewing admin activity audit logs (ADMIN only)")
public class ActivityLogController {

    @Autowired
    private ActivityLogRepository activityLogRepository;

    @GetMapping
    @Operation(summary = "View activity logs", description = "Retrieve paginated, filterable audit logs. ADMIN only.")
    public ResponseEntity<Map<String, Object>> getActivityLogs(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String entityType,
            Pageable pageable) {

        Page<ActivityLog> page = activityLogRepository.findFiltered(userId, action, entityType, pageable);

        Map<String, Object> response = new HashMap<>();
        response.put("logs", page.getContent());
        response.put("currentPage", page.getNumber());
        response.put("totalItems", page.getTotalElements());
        response.put("totalPages", page.getTotalPages());
        return ResponseEntity.ok(response);
    }
}
