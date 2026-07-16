package com.project.code.event;

import com.project.code.Model.StockTransfer;

public class StockTransferredEvent {
    private final StockTransfer stockTransfer;

    public StockTransferredEvent(StockTransfer stockTransfer) {
        this.stockTransfer = stockTransfer;
    }

    public StockTransfer getStockTransfer() {
        return stockTransfer;
    }
}
