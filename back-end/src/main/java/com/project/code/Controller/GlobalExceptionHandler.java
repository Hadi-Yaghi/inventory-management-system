package com.project.code.Controller;

import java.util.HashMap;
import java.util.Map;
import java.time.LocalDateTime;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.project.code.exception.InsufficientStockException;
import com.project.code.exception.NotFoundException;
import jakarta.persistence.EntityNotFoundException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private Map<String, Object> buildErrorResponse(String message, HttpStatus status) {
        Map<String, Object> response = new HashMap<>();
        response.put("message", message);
        response.put("status", status.value());
        response.put("timestamp", LocalDateTime.now().toString());
        return response;
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleJsonParseException(HttpMessageNotReadableException ex) {
        HttpStatus status = HttpStatus.BAD_REQUEST;
        return new ResponseEntity<>(buildErrorResponse("Invalid input: The data provided is not valid.", status), status);
    }

    @ExceptionHandler({EntityNotFoundException.class, NotFoundException.class})
    public ResponseEntity<Map<String, Object>> handleNotFoundException(Exception ex) {
        HttpStatus status = HttpStatus.NOT_FOUND;
        return new ResponseEntity<>(buildErrorResponse(ex.getMessage(), status), status);
    }

    @ExceptionHandler(InsufficientStockException.class)
    public ResponseEntity<Map<String, Object>> handleInsufficientStockException(InsufficientStockException ex) {
        HttpStatus status = HttpStatus.CONFLICT;
        return new ResponseEntity<>(buildErrorResponse(ex.getMessage(), status), status);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrityViolationException(DataIntegrityViolationException ex) {
        HttpStatus status = HttpStatus.BAD_REQUEST;
        String message = "Data integrity violation: database constraints violated.";
        String specificCause = ex.getMostSpecificCause().getMessage();
        if (specificCause != null && (specificCause.contains("sku") || specificCause.contains("Duplicate entry"))) {
            message = "A product with this SKU already exists.";
        } else if (specificCause != null) {
            message = "Database constraint violation: " + specificCause;
        }
        return new ResponseEntity<>(buildErrorResponse(message, status), status);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(MethodArgumentNotValidException ex) {
        HttpStatus status = HttpStatus.BAD_REQUEST;
        StringBuilder errorMsg = new StringBuilder("Validation failed: ");
        ex.getBindingResult().getFieldErrors().forEach(error -> {
            errorMsg.append("[").append(error.getField()).append(": ").append(error.getDefaultMessage()).append("] ");
        });
        return new ResponseEntity<>(buildErrorResponse(errorMsg.toString().trim(), status), status);
    }
}