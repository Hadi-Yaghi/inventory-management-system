package com.project.code.Service;

import com.project.code.Model.Inventory;
import com.project.code.Model.StockTransfer;
import com.project.code.Model.Store;
import com.project.code.Model.TransferStatus;
import com.project.code.Repo.InventoryRepository;
import com.project.code.Repo.ProductRepository;
import com.project.code.Repo.StockTransferRepository;
import com.project.code.Repo.StoreRepository;
import com.project.code.exception.InsufficientStockException;
import com.project.code.exception.NotFoundException;
import com.project.code.event.StockTransferredEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class StockTransferService {

    @Autowired
    private StockTransferRepository transferRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private ApplicationEventPublisher eventPublisher;

    @Autowired
    private com.project.code.security.SecurityService securityService;

    @Transactional
    @CacheEvict(value = {"dashboard", "analytics"}, allEntries = true)
    public StockTransfer initiateTransfer(Long productId, Long fromStoreId, Long toStoreId, Integer quantity) {
        if (!productRepository.existsById(productId)) {
            throw new NotFoundException("Product not found with ID: " + productId);
        }
        if (!storeRepository.existsById(fromStoreId)) {
            throw new NotFoundException("Source store not found with ID: " + fromStoreId);
        }
        if (!storeRepository.existsById(toStoreId)) {
            throw new NotFoundException("Destination store not found with ID: " + toStoreId);
        }

        securityService.verifyStoreAccess(fromStoreId);

        Inventory sourceInv = inventoryRepository.findByProductIdAndStoreId(productId, fromStoreId);
        if (sourceInv == null || sourceInv.getStockLevel() < quantity) {
            throw new InsufficientStockException("Insufficient stock in source store inventory. Requested: " + quantity +
                    ", Available: " + (sourceInv != null ? sourceInv.getStockLevel() : 0));
        }

        StockTransfer transfer = new StockTransfer(
                productId,
                fromStoreId,
                toStoreId,
                quantity,
                TransferStatus.PENDING,
                LocalDateTime.now()
        );
        transfer.setCreatedBy(securityService.getCurrentUser());

        StockTransfer savedTransfer = transferRepository.save(transfer);
        eventPublisher.publishEvent(new StockTransferredEvent(savedTransfer));
        return savedTransfer;
    }

    @Transactional
    @CacheEvict(value = {"dashboard", "analytics"}, allEntries = true)
    public StockTransfer confirmReceipt(Long transferId) {
        StockTransfer transfer = transferRepository.findById(transferId)
                .orElseThrow(() -> new NotFoundException("Stock transfer record not found with ID: " + transferId));

        securityService.verifyStoreAccess(transfer.getToStoreId());

        if (transfer.getStatus() != TransferStatus.PENDING) {
            throw new IllegalStateException("Transfer cannot be completed. Current status: " + transfer.getStatus());
        }

        transfer.setStatus(TransferStatus.COMPLETED);
        transfer.setCompletedAt(LocalDateTime.now());
        transfer.setReceivedBy(securityService.getCurrentUser());
        StockTransfer savedTransfer = transferRepository.save(transfer);
        eventPublisher.publishEvent(new StockTransferredEvent(savedTransfer));
        return savedTransfer;
    }

    @Transactional
    @CacheEvict(value = {"dashboard", "analytics"}, allEntries = true)
    public StockTransfer cancelTransfer(Long transferId) {
        StockTransfer transfer = transferRepository.findById(transferId)
                .orElseThrow(() -> new NotFoundException("Stock transfer record not found with ID: " + transferId));

        securityService.verifyStoreAccess(transfer.getFromStoreId());

        if (transfer.getStatus() != TransferStatus.PENDING) {
            throw new IllegalStateException("Transfer cannot be cancelled. Current status: " + transfer.getStatus());
        }

        transfer.setStatus(TransferStatus.CANCELLED);
        transfer.setCompletedAt(LocalDateTime.now());
        transfer.setApprovedBy(securityService.getCurrentUser());
        transfer.setApprovedAt(LocalDateTime.now());
        StockTransfer savedTransfer = transferRepository.save(transfer);
        eventPublisher.publishEvent(new StockTransferredEvent(savedTransfer));
        return savedTransfer;
    }

    public List<StockTransfer> getTransferHistory() {
        if (securityService.isUserAdmin()) {
            return transferRepository.findAll();
        } else {
            java.util.Set<Long> storeIds = securityService.getAssignedStoreIds();
            return transferRepository.findAll().stream()
                    .filter(t -> storeIds.contains(t.getFromStoreId()) || storeIds.contains(t.getToStoreId()))
                    .collect(java.util.stream.Collectors.toList());
        }
    }
}
