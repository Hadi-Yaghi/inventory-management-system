package com.project.code.Service;


import com.project.code.Model.*;
import com.project.code.Repo.*;
import com.project.code.exception.InsufficientStockException;
import com.project.code.exception.NotFoundException;
import com.project.code.event.OrderCreatedEvent;
import com.project.code.event.OrderCompletedEvent;
import com.project.code.event.OrderCancelledEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class OrderService {



    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private InventoryRepository inventoryRepository;
    @Autowired
    private CustomerRepository customerRepository;
    @Autowired
    private StoreRepository storeRepository;
    @Autowired
    private OrderDetailsRepository orderDetailsRepository;
    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private ApplicationEventPublisher eventPublisher;

    @Autowired
    private com.project.code.security.SecurityService securityService;

    @Transactional
    @CacheEvict(value = {"dashboard", "analytics"}, allEntries = true)
    public void saveOrder(PlaceOrderRequestDTO placeOrderRequest){
        securityService.verifyStoreAccess(placeOrderRequest.getStoreId());
        
        List<PurchaseProductDTO> purchaseProducts = placeOrderRequest.getPurchaseProduct();
        if (purchaseProducts != null) {
            for (PurchaseProductDTO productDTO : purchaseProducts) {
                Inventory inventory = inventoryRepository.findByProductIdAndStoreIdWithLock(productDTO.getId(), placeOrderRequest.getStoreId());
                if (inventory == null) {
                    throw new NotFoundException("Inventory record not found for product ID " + productDTO.getId() + " at store ID " + placeOrderRequest.getStoreId());
                }
                if (inventory.getStockLevel() == null || inventory.getAvailableQuantity() < productDTO.getQuantity()) {
                    throw new InsufficientStockException("Insufficient stock for product: " + productDTO.getName() + ". Available: " + (inventory.getAvailableQuantity() != null ? inventory.getAvailableQuantity() : 0) + ", Requested: " + productDTO.getQuantity());
                }
            }
        }

        Customer existingcustomer = customerRepository.findByEmail(placeOrderRequest.getCustomerEmail());
        Customer customer = new Customer();
        customer.setName(placeOrderRequest.getCustomerName());
        customer.setEmail(placeOrderRequest.getCustomerEmail());
        customer.setPhone(placeOrderRequest.getCustomerPhone());

        if(existingcustomer ==null){
            customer = customerRepository.save(customer);
        }
        else{
            customer=existingcustomer;
        }

        Store store = storeRepository.findById(placeOrderRequest.getStoreId())
                .orElseThrow(() -> new NotFoundException("Store not found with ID: " + placeOrderRequest.getStoreId()));

        OrderDetails orderDetails = new OrderDetails();
        orderDetails.setCustomer(customer);
        orderDetails.setStore(store);
        orderDetails.setTotalPrice(placeOrderRequest.getTotalPrice());
        orderDetails.setDate(java.time.LocalDateTime.now());
        orderDetails.setOrderStatus(OrderStatus.PENDING);
        try {
            orderDetails.setCreatedBy(securityService.getCurrentUser());
        } catch (Exception e) {
            // handle anonymous placing or similar if required, otherwise let it fall through
        }

        orderDetails = orderDetailsRepository.save(orderDetails);

        java.util.ArrayList<OrderItem> itemsList = new java.util.ArrayList<>();
        if (purchaseProducts != null) {
            for (PurchaseProductDTO productDTO : purchaseProducts) {
                OrderItem orderItem = new OrderItem();
                orderItem.setOrder(orderDetails);
                orderItem.setProduct(productRepository.findByid(productDTO.getId()));
                orderItem.setQuantity(productDTO.getQuantity());
                orderItem.setPrice(productDTO.getPrice()*productDTO.getQuantity());
                orderItemRepository.save(orderItem);
                itemsList.add(orderItem);
            }
        }
        orderDetails.setOrderItems(itemsList);

        eventPublisher.publishEvent(new OrderCreatedEvent(orderDetails));
    }

    @Transactional
    @CacheEvict(value = {"dashboard", "analytics"}, allEntries = true)
    public void transitionStatus(Long orderId, OrderStatus newStatus) {
        OrderDetails order = orderDetailsRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found with ID: " + orderId));

        securityService.verifyStoreAccess(order.getStore().getId());

        OrderStatus currentStatus = order.getOrderStatus();
        if (currentStatus == newStatus) {
            return;
        }

        // Validate allowed transitions
        if (currentStatus == OrderStatus.COMPLETED || currentStatus == OrderStatus.CANCELLED) {
            throw new IllegalArgumentException("Cannot transition status from terminal state: " + currentStatus);
        }

        if (currentStatus == OrderStatus.PENDING) {
            if (newStatus != OrderStatus.CONFIRMED && newStatus != OrderStatus.CANCELLED) {
                throw new IllegalArgumentException("Cannot transition from PENDING to " + newStatus);
            }
        } else if (currentStatus == OrderStatus.CONFIRMED) {
            if (newStatus != OrderStatus.COMPLETED && newStatus != OrderStatus.CANCELLED) {
                throw new IllegalArgumentException("Cannot transition from CONFIRMED to " + newStatus);
            }
        }

        order.setOrderStatus(newStatus);
        orderDetailsRepository.save(order);

        if (newStatus == OrderStatus.COMPLETED) {
            eventPublisher.publishEvent(new OrderCompletedEvent(order));
        }

        // If cancelling, release reservation
        if (newStatus == OrderStatus.CANCELLED) {
            eventPublisher.publishEvent(new OrderCancelledEvent(order));
        }
    }

    public OrderDetails getOrderById(Long orderId) {
        return orderDetailsRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found with ID: " + orderId));
    }
}
