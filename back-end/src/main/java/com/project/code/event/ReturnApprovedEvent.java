package com.project.code.event;

import com.project.code.Model.ReturnRequest;

public class ReturnApprovedEvent {
    private final ReturnRequest returnRequest;

    public ReturnApprovedEvent(ReturnRequest returnRequest) {
        this.returnRequest = returnRequest;
    }

    public ReturnRequest getReturnRequest() {
        return returnRequest;
    }
}
