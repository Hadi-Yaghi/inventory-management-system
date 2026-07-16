package com.project.code.Service;

import com.project.code.Model.*;
import com.project.code.Repo.*;
import com.project.code.exception.NotFoundException;
import com.project.code.event.ReturnApprovedEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ReturnService {

    @Autowired
    private ReturnRequestRepository returnRequestRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private ApplicationEventPublisher eventPublisher;

    @Autowired
    private com.project.code.security.SecurityService securityService;

    @CacheEvict(value = {"dashboard", "analytics"}, allEntries = true)
    public ReturnRequest requestReturn(Long orderItemId, Integer quantity, String reason) {
        OrderItem orderItem = orderItemRepository.findById(orderItemId)
                .orElseThrow(() -> new NotFoundException("Order Item not found with ID: " + orderItemId));

        securityService.verifyStoreAccess(orderItem.getOrder().getStore().getId());

        if (quantity <= 0 || quantity > orderItem.getQuantity()) {
            throw new IllegalArgumentException("Invalid return quantity. Must be between 1 and " + orderItem.getQuantity());
        }

        ReturnRequest request = new ReturnRequest(orderItemId, quantity, reason);
        request.setRequestedBy(securityService.getCurrentUser());
        return returnRequestRepository.save(request);
    }

    @Transactional
    @CacheEvict(value = {"dashboard", "analytics"}, allEntries = true)
    public ReturnRequest approveReturn(Long requestId) {
        ReturnRequest request = returnRequestRepository.findById(requestId)
                .orElseThrow(() -> new NotFoundException("Return Request not found with ID: " + requestId));

        OrderItem orderItem = orderItemRepository.findById(request.getOrderItemId())
                .orElseThrow(() -> new NotFoundException("Order Item not found with ID: " + request.getOrderItemId()));

        securityService.verifyStoreAccess(orderItem.getOrder().getStore().getId());

        if (request.getStatus() != ReturnStatus.REQUESTED) {
            throw new IllegalArgumentException("Cannot approve return request in status: " + request.getStatus());
        }

        request.setStatus(ReturnStatus.APPROVED);
        request.setApprovedBy(securityService.getCurrentUser());
        request.setProcessedBy(securityService.getCurrentUser());
        request.setApprovedAt(java.time.LocalDateTime.now());
        request.setProcessedAt(java.time.LocalDateTime.now());
        ReturnRequest savedRequest = returnRequestRepository.save(request);

        eventPublisher.publishEvent(new ReturnApprovedEvent(savedRequest));

        return savedRequest;
    }

    @Transactional
    @CacheEvict(value = {"dashboard", "analytics"}, allEntries = true)
    public ReturnRequest rejectReturn(Long requestId) {
        ReturnRequest request = returnRequestRepository.findById(requestId)
                .orElseThrow(() -> new NotFoundException("Return Request not found with ID: " + requestId));

        OrderItem orderItem = orderItemRepository.findById(request.getOrderItemId())
                .orElseThrow(() -> new NotFoundException("Order Item not found with ID: " + request.getOrderItemId()));

        securityService.verifyStoreAccess(orderItem.getOrder().getStore().getId());

        if (request.getStatus() != ReturnStatus.REQUESTED) {
            throw new IllegalArgumentException("Cannot reject return request in status: " + request.getStatus());
        }

        request.setStatus(ReturnStatus.REJECTED);
        request.setApprovedBy(securityService.getCurrentUser());
        request.setProcessedBy(securityService.getCurrentUser());
        request.setProcessedAt(java.time.LocalDateTime.now());
        ReturnRequest savedRequest = returnRequestRepository.save(request);

        // Send Email Notification
        emailService.sendReturnStatusEmail(savedRequest, orderItem.getOrder().getCustomer().getEmail());

        return savedRequest;
    }

    public List<ReturnRequest> getAllReturnRequests() {
        if (securityService.isUserAdmin()) {
            return returnRequestRepository.findAll();
        } else {
            java.util.Set<Long> storeIds = securityService.getAssignedStoreIds();
            return returnRequestRepository.findByStoreIdIn(storeIds);
        }
    }

    public List<ReturnRequest> getReturnRequestsForStore(Long storeId) {
        securityService.verifyStoreAccess(storeId);
        return returnRequestRepository.findByStoreIdIn(java.util.Collections.singleton(storeId));
    }
}
