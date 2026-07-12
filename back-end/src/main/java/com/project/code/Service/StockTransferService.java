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
import org.springframework.beans.factory.annotation.Autowired;
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

    @Transactional
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

        Inventory sourceInv = inventoryRepository.findByProductIdAndStoreId(productId, fromStoreId);
        if (sourceInv == null || sourceInv.getStockLevel() < quantity) {
            throw new InsufficientStockException("Insufficient stock in source store inventory. Requested: " + quantity +
                    ", Available: " + (sourceInv != null ? sourceInv.getStockLevel() : 0));
        }

        // Decrement source inventory stock level
        sourceInv.setStockLevel(sourceInv.getStockLevel() - quantity);
        inventoryRepository.save(sourceInv);

        StockTransfer transfer = new StockTransfer(
                productId,
                fromStoreId,
                toStoreId,
                quantity,
                TransferStatus.PENDING,
                LocalDateTime.now()
        );

        return transferRepository.save(transfer);
    }

    @Transactional
    public StockTransfer confirmReceipt(Long transferId) {
        StockTransfer transfer = transferRepository.findById(transferId)
                .orElseThrow(() -> new NotFoundException("Stock transfer record not found with ID: " + transferId));

        if (transfer.getStatus() != TransferStatus.PENDING) {
            throw new IllegalStateException("Transfer cannot be completed. Current status: " + transfer.getStatus());
        }

        // Increment destination store inventory
        Inventory destInv = inventoryRepository.findByProductIdAndStoreId(transfer.getProductId(), transfer.getToStoreId());
        if (destInv == null) {
            // Create new inventory record in destination store
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

        transfer.setStatus(TransferStatus.COMPLETED);
        transfer.setCompletedAt(LocalDateTime.now());
        return transferRepository.save(transfer);
    }

    @Transactional
    public StockTransfer cancelTransfer(Long transferId) {
        StockTransfer transfer = transferRepository.findById(transferId)
                .orElseThrow(() -> new NotFoundException("Stock transfer record not found with ID: " + transferId));

        if (transfer.getStatus() != TransferStatus.PENDING) {
            throw new IllegalStateException("Transfer cannot be cancelled. Current status: " + transfer.getStatus());
        }

        // Return quantity to source store inventory
        Inventory sourceInv = inventoryRepository.findByProductIdAndStoreId(transfer.getProductId(), transfer.getFromStoreId());
        if (sourceInv != null) {
            sourceInv.setStockLevel(sourceInv.getStockLevel() + transfer.getQuantity());
            inventoryRepository.save(sourceInv);
        }

        transfer.setStatus(TransferStatus.CANCELLED);
        transfer.setCompletedAt(LocalDateTime.now());
        return transferRepository.save(transfer);
    }

    public List<StockTransfer> getTransferHistory() {
        return transferRepository.findAll();
    }
}
