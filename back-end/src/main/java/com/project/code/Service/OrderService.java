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

        orderDetails = orderDetailsRepository.save(orderDetails);

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
            }
        }

    }
}
