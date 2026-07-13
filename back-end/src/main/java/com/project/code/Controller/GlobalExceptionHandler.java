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
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;

import com.project.code.exception.InsufficientStockException;
import com.project.code.exception.NotFoundException;
import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.HttpServletRequest;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private Map<String, Object> buildErrorResponse(String message, HttpStatus status, HttpServletRequest request) {
        Map<String, Object> response = new HashMap<>();
        response.put("message", message);
        response.put("status", status.value());
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("path", request.getRequestURI());
        return response;
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleJsonParseException(HttpMessageNotReadableException ex, HttpServletRequest request) {
        HttpStatus status = HttpStatus.BAD_REQUEST;
        return new ResponseEntity<>(buildErrorResponse("Invalid input: The data provided is not valid.", status, request), status);
    }

    @ExceptionHandler({EntityNotFoundException.class, NotFoundException.class})
    public ResponseEntity<Map<String, Object>> handleNotFoundException(Exception ex, HttpServletRequest request) {
        HttpStatus status = HttpStatus.NOT_FOUND;
        return new ResponseEntity<>(buildErrorResponse(ex.getMessage(), status, request), status);
    }

    @ExceptionHandler(InsufficientStockException.class)
    public ResponseEntity<Map<String, Object>> handleInsufficientStockException(InsufficientStockException ex, HttpServletRequest request) {
        HttpStatus status = HttpStatus.CONFLICT;
        return new ResponseEntity<>(buildErrorResponse(ex.getMessage(), status, request), status);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrityViolationException(DataIntegrityViolationException ex, HttpServletRequest request) {
        HttpStatus status = HttpStatus.BAD_REQUEST;
        String message = "Data integrity violation: database constraints violated.";
        String specificCause = ex.getMostSpecificCause().getMessage();
        if (specificCause != null && (specificCause.contains("sku") || specificCause.contains("Duplicate entry"))) {
            message = "A product with this SKU already exists.";
        } else if (specificCause != null) {
            message = "Database constraint violation: " + specificCause;
        }
        return new ResponseEntity<>(buildErrorResponse(message, status, request), status);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(MethodArgumentNotValidException ex, HttpServletRequest request) {
        HttpStatus status = HttpStatus.BAD_REQUEST;
        StringBuilder errorMsg = new StringBuilder("Validation failed: ");
        ex.getBindingResult().getFieldErrors().forEach(error -> {
            errorMsg.append("[").append(error.getField()).append(": ").append(error.getDefaultMessage()).append("] ");
        });
        return new ResponseEntity<>(buildErrorResponse(errorMsg.toString().trim(), status, request), status);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<Map<String, Object>> handleAuthenticationException(AuthenticationException ex, HttpServletRequest request) {
        HttpStatus status = HttpStatus.UNAUTHORIZED;
        return new ResponseEntity<>(buildErrorResponse("Authentication failed: " + ex.getMessage(), status, request), status);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDeniedException(AccessDeniedException ex, HttpServletRequest request) {
        HttpStatus status = HttpStatus.FORBIDDEN;
        return new ResponseEntity<>(buildErrorResponse("Access denied: " + ex.getMessage(), status, request), status);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex, HttpServletRequest request) {
        HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;
        return new ResponseEntity<>(buildErrorResponse("An unexpected error occurred: " + ex.getMessage(), status, request), status);
    }
}