package com.project.code.Service;


import com.project.code.Model.*;
import com.project.code.Repo.*;
import com.project.code.exception.InsufficientStockException;
import com.project.code.exception.NotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
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
    private PdfInvoiceService pdfInvoiceService;

    @Autowired
    private EmailService emailService;

    @Transactional
    public void saveOrder(PlaceOrderRequestDTO placeOrderRequest){
        List<PurchaseProductDTO> purchaseProducts = placeOrderRequest.getPurchaseProduct();
        if (purchaseProducts != null) {
            for (PurchaseProductDTO productDTO : purchaseProducts) {
                Inventory inventory = inventoryRepository.findByProductIdAndStoreId(productDTO.getId(), placeOrderRequest.getStoreId());
                if (inventory == null) {
                    throw new NotFoundException("Inventory record not found for product ID " + productDTO.getId() + " at store ID " + placeOrderRequest.getStoreId());
                }
                if (inventory.getStockLevel() == null || inventory.getStockLevel() < productDTO.getQuantity()) {
                    throw new InsufficientStockException("Insufficient stock for product: " + productDTO.getName() + ". Available: " + (inventory.getStockLevel() != null ? inventory.getStockLevel() : 0) + ", Requested: " + productDTO.getQuantity());
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

        orderDetails = orderDetailsRepository.save(orderDetails);

        java.util.ArrayList<OrderItem> itemsList = new java.util.ArrayList<>();
        if (purchaseProducts != null) {
            for (PurchaseProductDTO productDTO : purchaseProducts) {
                OrderItem orderItem = new OrderItem();
                Inventory inventory = inventoryRepository.findByProductIdAndStoreId(productDTO.getId(),placeOrderRequest.getStoreId());
                inventory.setStockLevel(inventory.getStockLevel()-productDTO.getQuantity());

                inventoryRepository.save(inventory);
                orderItem.setOrder(orderDetails);
                orderItem.setProduct(productRepository.findByid(productDTO.getId()));
                orderItem.setQuantity(productDTO.getQuantity());
                orderItem.setPrice(productDTO.getPrice()*productDTO.getQuantity());
                orderItemRepository.save(orderItem);
                itemsList.add(orderItem);
            }
        }
        orderDetails.setOrderItems(itemsList);

        // Generate PDF Invoice and send email confirmation
        try {
            byte[] pdfBytes = pdfInvoiceService.generateInvoicePdf(orderDetails);
            emailService.sendOrderConfirmation(orderDetails, pdfBytes);
        } catch (Exception e) {
            System.err.println("Could not generate or send PDF invoice: " + e.getMessage());
        }
    }

    @Transactional
    public void transitionStatus(Long orderId, OrderStatus newStatus) {
        OrderDetails order = orderDetailsRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found with ID: " + orderId));

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

        // If cancelling, restore inventory stock level
        if (newStatus == OrderStatus.CANCELLED) {
            List<OrderItem> items = order.getOrderItems();
            if (items != null) {
                for (OrderItem item : items) {
                    Inventory inventory = inventoryRepository.findByProductIdAndStoreId(
                            item.getProduct().getId(), order.getStore().getId());
                    if (inventory != null) {
                        inventory.setStockLevel(inventory.getStockLevel() + item.getQuantity());
                        inventoryRepository.save(inventory);
                    }
                }
            }
        }
    }

    public OrderDetails getOrderById(Long orderId) {
        return orderDetailsRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Order not found with ID: " + orderId));
    }
}
