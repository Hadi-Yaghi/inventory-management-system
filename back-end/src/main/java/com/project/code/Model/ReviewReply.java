package com.project.code.Model;

import java.time.LocalDateTime;

public class ReviewReply {

    private String authorId;
    private String text;
    private LocalDateTime createdAt = LocalDateTime.now();

    public ReviewReply() {
    }

    public ReviewReply(String authorId, String text) {
        this.authorId = authorId;
        this.text = text;
        this.createdAt = LocalDateTime.now();
    }

    public String getAuthorId() {
        return authorId;
    }

    public void setAuthorId(String authorId) {
        this.authorId = authorId;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
