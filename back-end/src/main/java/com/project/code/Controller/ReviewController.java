package com.project.code.Controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

import com.project.code.Model.Customer;
import com.project.code.Model.Review;
import com.project.code.Repo.CustomerRepository;
import com.project.code.Repo.ReviewRepository;

@RestController
@RequestMapping("/reviews")
@Tag(name = "Review Controller", description = "Endpoints for managing customer reviews")
public class ReviewController {

    @Autowired
    ReviewRepository reviewRepository;

    @Autowired
    CustomerRepository customerRepository;

    @GetMapping("/{storeId}/{productId}")
    @Operation(summary = "Get reviews for a product in a store with pagination", description = "Retrieve a list of reviews for a product in a store, including customer names, using pagination.")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved reviews")
    public Map<String,Object> getReviews(@PathVariable long storeId, @PathVariable long productId, Pageable pageable)
    {
        Map<String, Object> map = new HashMap<>();
        Page<Review> page = reviewRepository.findByStoreIdAndProductId(storeId, productId, pageable);

        List<Map<String, Object>> reviewsWithCustomerNames = new ArrayList<>();

        // For each review, fetch customer details and add them to the response
        for (Review review : page.getContent()) {
            Map<String, Object> reviewMap = new HashMap<>();
            reviewMap.put("review", review.getComment());
            reviewMap.put("rating", review.getRating());

            // Fetch customer details using customerId
            Customer customer = customerRepository.findByid(review.getCustomerId());
            if (customer != null) {
                reviewMap.put("customerName", customer.getName());
            } else {
                reviewMap.put("customerName", "Unknown");
            }

            reviewsWithCustomerNames.add(reviewMap);
        }

        map.put("reviews", reviewsWithCustomerNames);
        map.put("currentPage", page.getNumber());
        map.put("totalItems", page.getTotalElements());
        map.put("totalPages", page.getTotalPages());
        return map;

    }

    @GetMapping
    @Operation(summary = "Get all reviews with pagination", description = "Retrieve a list of all reviews in the system using pagination.")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved all reviews")
    public Map<String,Object> getAllReviews(Pageable pageable)
    {
        Page<Review> page = reviewRepository.findAll(pageable);
        Map<String,Object> map = new HashMap<>();
        map.put("reviews", page.getContent());
        map.put("currentPage", page.getNumber());
        map.put("totalItems", page.getTotalElements());
        map.put("totalPages", page.getTotalPages());
        return map;
    }


}