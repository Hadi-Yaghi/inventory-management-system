package com.project.code.Model;

import jakarta.persistence.Id;
import jakarta.validation.constraints.NotNull;
import org.springframework.data.mongodb.core.mapping.Document;
@Document(collection = "reviews")
public class Review {


@Id
private String id;


    @NotNull(message = "customer cannot be null")
  private Long customerId;
    @NotNull(message = "product cannot be null")
  private Long productId;
    @NotNull(message = "store cannot be null")
  private Long storeId;

  private int rating;
  private String comment;

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

    public Review() {
    }
}
