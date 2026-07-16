package com.project.code.Service;

import com.project.code.Model.*;
import com.project.code.Repo.*;
import com.project.code.exception.NotFoundException;
import com.project.code.event.PurchaseOrderReceivedEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class PurchaseOrderService {

    @Autowired
    private PurchaseOrderRepository purchaseOrderRepository;

    @Autowired
    private SupplierRepository supplierRepository;

    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private ApplicationEventPublisher eventPublisher;

    @Autowired
    private com.project.code.security.SecurityService securityService;

    public Page<PurchaseOrder> getPurchaseOrders(Long supplierId, Long storeId, PurchaseOrderStatus status, Pageable pageable) {
        Specification<PurchaseOrder> spec = Specification.where(null);
        
        if (!securityService.isUserAdmin()) {
            java.util.Set<Long> storeIds = securityService.getAssignedStoreIds();
            if (storeId != null) {
                securityService.verifyStoreAccess(storeId);
                spec = spec.and((root, query, cb) -> cb.equal(root.get("store").get("id"), storeId));
            } else {
                spec = spec.and((root, query, cb) -> root.get("store").get("id").in(storeIds));
            }
        } else if (storeId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("store").get("id"), storeId));
        }

        if (supplierId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("supplier").get("id"), supplierId));
        }
        if (status != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), status));
        }

        return purchaseOrderRepository.findAll(spec, pageable);
    }

    public PurchaseOrder getPurchaseOrderById(Long id) {
        return purchaseOrderRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Purchase order not found with ID: " + id));
    }

    @Transactional
    @CacheEvict(value = {"dashboard", "analytics"}, allEntries = true)
    public PurchaseOrder createPurchaseOrder(CreatePurchaseOrderDTO dto, String username) {
        securityService.verifyStoreAccess(dto.getStoreId());

        Supplier supplier = supplierRepository.findById(dto.getSupplierId())
                .orElseThrow(() -> new NotFoundException("Supplier not found with ID: " + dto.getSupplierId()));

        Store store = storeRepository.findById(dto.getStoreId())
                .orElseThrow(() -> new NotFoundException("Store not found with ID: " + dto.getStoreId()));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found with username: " + username));

        PurchaseOrder po = new PurchaseOrder();
        po.setSupplier(supplier);
        po.setStore(store);
        po.setCreatedBy(user);
        po.setOrderDate(LocalDateTime.now());
        po.setStatus(PurchaseOrderStatus.PENDING);

        if (dto.getExpectedDate() != null && !dto.getExpectedDate().isEmpty()) {
            try {
                po.setExpectedDate(LocalDateTime.parse(dto.getExpectedDate()));
            } catch (Exception e) {
                try {
                    po.setExpectedDate(java.time.LocalDate.parse(dto.getExpectedDate()).atStartOfDay());
                } catch (Exception ex) {
                    po.setExpectedDate(LocalDateTime.now().plusDays(7));
                }
            }
        } else {
            po.setExpectedDate(LocalDateTime.now().plusDays(7));
        }

        List<PurchaseOrderItem> items = new ArrayList<>();
        if (dto.getItems() != null) {
            for (CreatePurchaseOrderItemDTO itemDto : dto.getItems()) {
                Product product = productRepository.findById(itemDto.getProductId())
                        .orElseThrow(() -> new NotFoundException("Product not found with ID: " + itemDto.getProductId()));

                PurchaseOrderItem item = new PurchaseOrderItem();
                item.setPurchaseOrder(po);
                item.setProduct(product);
                item.setQuantityOrdered(itemDto.getQuantityOrdered());
                item.setQuantityReceived(0);
                item.setUnitCost(itemDto.getUnitCost());
                items.add(item);
            }
        }
        po.setItems(items);

        return purchaseOrderRepository.save(po);
    }

    @Transactional
    @CacheEvict(value = {"dashboard", "analytics"}, allEntries = true)
    public PurchaseOrder receiveShipment(Long id, List<ReceiveItemDTO> receivedItems) {
        PurchaseOrder po = getPurchaseOrderById(id);
        securityService.verifyStoreAccess(po.getStore().getId());

        po.setReceivedBy(securityService.getCurrentUser());
        po.setReceivedAt(LocalDateTime.now());

        if (po.getStatus() == PurchaseOrderStatus.CANCELLED) {
            throw new IllegalStateException("Cannot receive shipment for a CANCELLED purchase order.");
        }

        if (po.getStatus() == PurchaseOrderStatus.RECEIVED) {
            throw new IllegalStateException("Purchase order has already been fully RECEIVED.");
        }

        for (ReceiveItemDTO receivedDto : receivedItems) {
            PurchaseOrderItem targetItem = po.getItems().stream()
                    .filter(item -> item.getProduct().getId() == receivedDto.getProductId())
                    .findFirst()
                    .orElseThrow(() -> new NotFoundException("Product with ID " + receivedDto.getProductId() + " is not part of this purchase order."));

            targetItem.setQuantityReceived(targetItem.getQuantityReceived() + receivedDto.getQuantityReceived());
        }

        // Auto-transition status
        boolean allReceived = true;
        boolean anyReceived = false;

        for (PurchaseOrderItem item : po.getItems()) {
            if (item.getQuantityReceived() < item.getQuantityOrdered()) {
                allReceived = false;
            }
            if (item.getQuantityReceived() > 0) {
                anyReceived = true;
            }
        }

        if (allReceived) {
            po.setStatus(PurchaseOrderStatus.RECEIVED);
        } else if (anyReceived) {
            po.setStatus(PurchaseOrderStatus.PARTIALLY_RECEIVED);
        } else {
            po.setStatus(PurchaseOrderStatus.ORDERED);
        }

        PurchaseOrder savedPo = purchaseOrderRepository.save(po);
        eventPublisher.publishEvent(new PurchaseOrderReceivedEvent(savedPo, receivedItems));
        return savedPo;
    }

    @Transactional
    @CacheEvict(value = {"dashboard", "analytics"}, allEntries = true)
    public PurchaseOrder cancelPurchaseOrder(Long id) {
        PurchaseOrder po = getPurchaseOrderById(id);
        securityService.verifyStoreAccess(po.getStore().getId());

        if (po.getStatus() == PurchaseOrderStatus.RECEIVED || po.getStatus() == PurchaseOrderStatus.PARTIALLY_RECEIVED) {
            throw new IllegalStateException("Cannot cancel a purchase order that has already been partially or fully received.");
        }

        po.setStatus(PurchaseOrderStatus.CANCELLED);
        return purchaseOrderRepository.save(po);
    }

    @Transactional
    @CacheEvict(value = {"dashboard", "analytics"}, allEntries = true)
    public PurchaseOrder approvePurchaseOrder(Long id) {
        PurchaseOrder po = getPurchaseOrderById(id);
        securityService.verifyStoreAccess(po.getStore().getId());

        if (po.getStatus() != PurchaseOrderStatus.PENDING) {
            throw new IllegalStateException("Only PENDING purchase orders can be approved. Current status: " + po.getStatus());
        }

        po.setStatus(PurchaseOrderStatus.ORDERED);
        po.setApprovedBy(securityService.getCurrentUser());
        po.setApprovedAt(LocalDateTime.now());
        return purchaseOrderRepository.save(po);
    }
}
