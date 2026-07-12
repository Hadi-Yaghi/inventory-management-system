package com.project.code.Service;

import com.project.code.Model.*;
import com.project.code.Repo.*;
import com.project.code.exception.NotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
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

    public ReturnRequest requestReturn(Long orderItemId, Integer quantity, String reason) {
        OrderItem orderItem = orderItemRepository.findById(orderItemId)
                .orElseThrow(() -> new NotFoundException("Order Item not found with ID: " + orderItemId));

        if (quantity <= 0 || quantity > orderItem.getQuantity()) {
            throw new IllegalArgumentException("Invalid return quantity. Must be between 1 and " + orderItem.getQuantity());
        }

        ReturnRequest request = new ReturnRequest(orderItemId, quantity, reason);
        return returnRequestRepository.save(request);
    }

    @Transactional
    public ReturnRequest approveReturn(Long requestId) {
        ReturnRequest request = returnRequestRepository.findById(requestId)
                .orElseThrow(() -> new NotFoundException("Return Request not found with ID: " + requestId));

        if (request.getStatus() != ReturnStatus.REQUESTED) {
            throw new IllegalArgumentException("Cannot approve return request in status: " + request.getStatus());
        }

        OrderItem orderItem = orderItemRepository.findById(request.getOrderItemId())
                .orElseThrow(() -> new NotFoundException("Order Item not found with ID: " + request.getOrderItemId()));

        OrderDetails order = orderItem.getOrder();
        Store store = order.getStore();
        Product product = orderItem.getProduct();

        // Find relevant inventory and restock
        Inventory inventory = inventoryRepository.findByProductIdAndStoreId(product.getId(), store.getId());
        if (inventory != null) {
            inventory.setStockLevel(inventory.getStockLevel() + request.getQuantity());
            inventoryRepository.save(inventory);
        }

        request.setStatus(ReturnStatus.APPROVED);
        ReturnRequest savedRequest = returnRequestRepository.save(request);

        // Send Email Notification
        emailService.sendReturnStatusEmail(savedRequest, order.getCustomer().getEmail());

        return savedRequest;
    }

    @Transactional
    public ReturnRequest rejectReturn(Long requestId) {
        ReturnRequest request = returnRequestRepository.findById(requestId)
                .orElseThrow(() -> new NotFoundException("Return Request not found with ID: " + requestId));

        if (request.getStatus() != ReturnStatus.REQUESTED) {
            throw new IllegalArgumentException("Cannot reject return request in status: " + request.getStatus());
        }

        OrderItem orderItem = orderItemRepository.findById(request.getOrderItemId())
                .orElseThrow(() -> new NotFoundException("Order Item not found with ID: " + request.getOrderItemId()));

        request.setStatus(ReturnStatus.REJECTED);
        ReturnRequest savedRequest = returnRequestRepository.save(request);

        // Send Email Notification
        emailService.sendReturnStatusEmail(savedRequest, orderItem.getOrder().getCustomer().getEmail());

        return savedRequest;
    }

    public List<ReturnRequest> getAllReturnRequests() {
        return returnRequestRepository.findAll();
    }
}
