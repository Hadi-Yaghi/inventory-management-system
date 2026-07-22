package com.project.code.Model;

import jakarta.persistence.Id;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.mongodb.core.mapping.Document;
@Document(collection = "reviews")
public class Review {


@Id
private String id;

@NotNull
private Long organizationId;


    @NotNull(message = "customer cannot be null")
  private Long customerId;
    @NotNull(message = "product cannot be null")
  private Long productId;
    @NotNull(message = "store cannot be null")
  private Long storeId;

  private int rating;
  private String comment;
  private String title;
  private java.util.List<String> photoUrls = new java.util.ArrayList<>();
  private boolean verifiedPurchase = false;
  private int likes = 0;
  private java.util.List<ReviewReply> replies = new java.util.ArrayList<>();

    public Review(Long customerId, Long productId, Long storeId, int rating) {
        this.customerId = customerId;
        this.productId = productId;
        this.storeId = storeId;
        this.rating = rating;
    }

    public Long getCustomerId() {
        return customerId;
    }

    public String getId() {
        return id;
    }
    public Long getOrganizationId() { return organizationId; }
    public void setOrganizationId(Long organizationId) { this.organizationId = organizationId; }

    public void setId(String id) {
        this.id = id;
    }


    public void setCustomerId(Long customerId) {
        this.customerId = customerId;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public Long getStoreId() {
        return storeId;
    }

    public void setStoreId(Long storeId) {
        this.storeId = storeId;
    }

    public int getRating() {
        return rating;
    }

    public void setRating(int rating) {
        this.rating = rating;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public java.util.List<String> getPhotoUrls() {
        return photoUrls;
    }

    public void setPhotoUrls(java.util.List<String> photoUrls) {
        this.photoUrls = photoUrls;
    }

    public boolean isVerifiedPurchase() {
        return verifiedPurchase;
    }

    public void setVerifiedPurchase(boolean verifiedPurchase) {
        this.verifiedPurchase = verifiedPurchase;
    }

    public int getLikes() {
        return likes;
    }

    public void setLikes(int likes) {
        this.likes = likes;
    }

    public java.util.List<ReviewReply> getReplies() {
        return replies;
    }

    public void setReplies(java.util.List<ReviewReply> replies) {
        this.replies = replies;
    }

    public Review() {
    }
}
