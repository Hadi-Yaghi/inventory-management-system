package com.project.code.Controller;

import com.project.code.security.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/uploads")
@Tag(name = "Product Image Controller", description = "Endpoints for uploading product images")
public class ProductImageController {

    @Autowired
    private FileStorageService fileStorageService;

    @PostMapping
    @Operation(summary = "Upload an image file", description = "Upload a product image using multipart/form-data. Accessible by ADMIN and MANAGER.")
    @ApiResponse(responseCode = "200", description = "File uploaded successfully")
    public ResponseEntity<Map<String, String>> uploadFile(@RequestParam("file") MultipartFile file) {
        String fileName = fileStorageService.storeFile(file);

        String fileDownloadUrl = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/uploads/")
                .path(fileName)
                .toUriString();

        Map<String, String> response = new HashMap<>();
        response.put("url", fileDownloadUrl);
        response.put("fileName", fileName);

        return ResponseEntity.ok(response);
    }
}
