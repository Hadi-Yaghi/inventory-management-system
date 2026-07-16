package com.project.code.listener;

import com.project.code.Model.*;
import com.project.code.Repo.*;
import com.project.code.event.*;
import com.project.code.exception.NotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class InventoryUpdateListener {

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @EventListener
    public void handleOrderCreated(OrderCreatedEvent event) {
        OrderDetails order = event.getOrderDetails();
        List<OrderItem> items = order.getOrderItems();
        if (items != null) {
            for (OrderItem item : items) {
                Inventory inventory = inventoryRepository.findByProductIdAndStoreIdWithLock(
                        item.getProduct().getId(), order.getStore().getId());
                if (inventory != null) {
                    inventory.setReservedQuantity(inventory.getReservedQuantity() + item.getQuantity());
                    inventoryRepository.save(inventory);
                }
            }
        }
    }

    @EventListener
    public void handleOrderCompleted(OrderCompletedEvent event) {
        OrderDetails order = event.getOrderDetails();
        List<OrderItem> items = order.getOrderItems();
        if (items != null) {
            for (OrderItem item : items) {
                Inventory inventory = inventoryRepository.findByProductIdAndStoreIdWithLock(
                        item.getProduct().getId(), order.getStore().getId());
                if (inventory != null) {
                    inventory.setStockLevel(Math.max(0, inventory.getStockLevel() - item.getQuantity()));
                    inventory.setReservedQuantity(Math.max(0, inventory.getReservedQuantity() - item.getQuantity()));
                    inventoryRepository.save(inventory);
                }
            }
        }
    }

    @EventListener
    public void handleOrderCancelled(OrderCancelledEvent event) {
        OrderDetails order = event.getOrderDetails();
        List<OrderItem> items = order.getOrderItems();
        if (items != null) {
            for (OrderItem item : items) {
                Inventory inventory = inventoryRepository.findByProductIdAndStoreIdWithLock(
                        item.getProduct().getId(), order.getStore().getId());
                if (inventory != null) {
                    inventory.setReservedQuantity(Math.max(0, inventory.getReservedQuantity() - item.getQuantity()));
                    inventoryRepository.save(inventory);
                }
            }
        }
    }

    @EventListener
    public void handleStockTransferred(StockTransferredEvent event) {
        StockTransfer transfer = event.getStockTransfer();
        if (transfer.getStatus() == TransferStatus.PENDING) {
            Inventory sourceInv = inventoryRepository.findByProductIdAndStoreId(
                    transfer.getProductId(), transfer.getFromStoreId());
            if (sourceInv != null) {
                sourceInv.setStockLevel(sourceInv.getStockLevel() - transfer.getQuantity());
                inventoryRepository.save(sourceInv);
            }
        } else if (transfer.getStatus() == TransferStatus.COMPLETED) {
            Inventory destInv = inventoryRepository.findByProductIdAndStoreId(
                    transfer.getProductId(), transfer.getToStoreId());
            if (destInv == null) {
                Store toStore = storeRepository.findById(transfer.getToStoreId())
                        .orElseThrow(() -> new NotFoundException("Store not found with ID: " + transfer.getToStoreId()));
                destInv = new Inventory(
                        productRepository.findByid(transfer.getProductId()),
                        toStore,
                        transfer.getQuantity()
                );
            } else {
                destInv.setStockLevel(destInv.getStockLevel() + transfer.getQuantity());
            }
            inventoryRepository.save(destInv);
        } else if (transfer.getStatus() == TransferStatus.CANCELLED) {
            Inventory sourceInv = inventoryRepository.findByProductIdAndStoreId(
                    transfer.getProductId(), transfer.getFromStoreId());
            if (sourceInv != null) {
                sourceInv.setStockLevel(sourceInv.getStockLevel() + transfer.getQuantity());
                inventoryRepository.save(sourceInv);
            }
        }
    }

    @EventListener
    public void handlePurchaseOrderReceived(PurchaseOrderReceivedEvent event) {
        PurchaseOrder po = event.getPurchaseOrder();
        for (ReceiveItemDTO receivedDto : event.getReceivedItems()) {
            PurchaseOrderItem targetItem = po.getItems().stream()
                    .filter(item -> item.getProduct().getId() == receivedDto.getProductId())
                    .findFirst()
                    .orElseThrow(() -> new NotFoundException("Product with ID " + receivedDto.getProductId() + " is not part of this purchase order."));

            Inventory inventory = inventoryRepository.findByProductIdAndStoreId(
                    receivedDto.getProductId(), po.getStore().getId());
            if (inventory == null) {
                inventory = new Inventory(targetItem.getProduct(), po.getStore(), receivedDto.getQuantityReceived());
            } else {
                inventory.setStockLevel(inventory.getStockLevel() + receivedDto.getQuantityReceived());
            }
            inventoryRepository.save(inventory);
        }
    }

    @EventListener
    public void handleReturnApproved(ReturnApprovedEvent event) {
        ReturnRequest request = event.getReturnRequest();
        OrderItem orderItem = orderItemRepository.findById(request.getOrderItemId())
                .orElseThrow(() -> new NotFoundException("Order Item not found with ID: " + request.getOrderItemId()));

        OrderDetails order = orderItem.getOrder();
        Store store = order.getStore();
        Product product = orderItem.getProduct();

        Inventory inventory = inventoryRepository.findByProductIdAndStoreIdWithLock(product.getId(), store.getId());
        if (inventory != null) {
            if (order.getOrderStatus() != OrderStatus.COMPLETED) {
                inventory.setReservedQuantity(Math.max(0, inventory.getReservedQuantity() - request.getQuantity()));
            } else {
                inventory.setStockLevel(inventory.getStockLevel() + request.getQuantity());
            }
            inventoryRepository.save(inventory);
        }
    }
}
