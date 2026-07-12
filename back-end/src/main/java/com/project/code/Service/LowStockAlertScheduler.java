package com.project.code.Service;

import com.project.code.Model.Inventory;
import com.project.code.Repo.InventoryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class LowStockAlertScheduler {

    private static final Logger log = LoggerFactory.getLogger(LowStockAlertScheduler.class);

    @Autowired
    private InventoryRepository inventoryRepository;

    // Run every day at midnight
    @Scheduled(cron = "0 0 0 * * ?")
    public void checkLowStock() {
        List<Inventory> lowStockItems = inventoryRepository.findAllLowStock();
        log.warn("DAILY LOW STOCK CHECK: Found {} items below threshold", lowStockItems.size());
        for (Inventory item : lowStockItems) {
            log.warn("Store: '{}', Product: '{}', Stock Level: {}, Threshold: {}",
                    item.getStore().getName(),
                    item.getProduct().getName(),
                    item.getStockLevel(),
                    item.getLowStockThreshold());
        }
    }
}
