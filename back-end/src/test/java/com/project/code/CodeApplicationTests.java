package com.project.code;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Assertions;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import com.project.code.Model.*;
import com.project.code.Repo.*;
import com.project.code.Service.*;

@SpringBootTest
class CodeApplicationTests {

	private static final String TEST_JWT_SECRET = generateTestSecret();

	@DynamicPropertySource
	static void configureTestProperties(DynamicPropertyRegistry registry) {
		registry.add("spring.datasource.url", () -> "jdbc:h2:mem:inventory_test;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE");
		registry.add("spring.datasource.driver-class-name", () -> "org.h2.Driver");
		registry.add("spring.datasource.username", () -> "sa");
		registry.add("spring.datasource.password", () -> "");
		registry.add("spring.jpa.database-platform", () -> "org.hibernate.dialect.H2Dialect");
		registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
		registry.add("spring.data.mongodb.uri", () -> "mongodb://localhost:27017/inventory_test");
		registry.add("jwt.secret", () -> TEST_JWT_SECRET);
	}

	@Autowired
	private OrderService orderService;

	@Autowired
	private InventoryRepository inventoryRepository;

	@Autowired
	private ProductRepository productRepository;

	@Autowired
	private StoreRepository storeRepository;

	@Autowired
	private CustomerRepository customerRepository;

	@Autowired
	private OrderDetailsRepository orderDetailsRepository;

	@Test
	@Transactional
	void testStockReservationLifecycle() {
		// 1. Setup store, product, and inventory
		Store store = new Store();
		store.setName("Test Store");
		store.setAddress("123 Test St");
		store = storeRepository.save(store);

		Product product = new Product();
		product.setName("Test Product");
		product.setPrice(10.0);
		product.setSku("TEST-SKU-123");
		product = productRepository.save(product);

		Inventory inventory = new Inventory(product, store, 10);
		inventory = inventoryRepository.save(inventory);

		Assertions.assertEquals(10, inventory.getStockLevel());
		Assertions.assertEquals(0, inventory.getReservedQuantity());
		Assertions.assertEquals(10, inventory.getAvailableQuantity());

		// 2. Place order for 3 items
		PlaceOrderRequestDTO request = new PlaceOrderRequestDTO();
		request.setStoreId(store.getId());
		request.setCustomerName("John Doe");
		request.setCustomerEmail("john@example.com");
		request.setCustomerPhone("1234567890");
		request.setTotalPrice(30.0);

		PurchaseProductDTO item = new PurchaseProductDTO();
		item.setId(product.getId());
		item.setName(product.getName());
		item.setPrice(product.getPrice());
		item.setQuantity(3);
		item.setTotal(30.0);
		request.setPurchaseProduct(List.of(item));

		orderService.saveOrder(request);

		// Verify stock level is untouched but reserved is updated
		Inventory updatedInventory = inventoryRepository.findByProductIdAndStoreId(product.getId(), store.getId());
		Assertions.assertEquals(10, updatedInventory.getStockLevel());
		Assertions.assertEquals(3, updatedInventory.getReservedQuantity());
		Assertions.assertEquals(7, updatedInventory.getAvailableQuantity());

		// Verify order exists and is PENDING
		OrderDetails order = orderDetailsRepository.findAll().stream()
				.filter(o -> o.getCustomer().getEmail().equals("john@example.com"))
				.findFirst()
				.orElseThrow();
		Assertions.assertEquals(OrderStatus.PENDING, order.getOrderStatus());

		// 3. Complete the order
		orderService.transitionStatus(order.getId(), OrderStatus.CONFIRMED);
		orderService.transitionStatus(order.getId(), OrderStatus.COMPLETED);

		// Verify reservation is converted to actual deduction
		updatedInventory = inventoryRepository.findByProductIdAndStoreId(product.getId(), store.getId());
		Assertions.assertEquals(7, updatedInventory.getStockLevel());
		Assertions.assertEquals(0, updatedInventory.getReservedQuantity());
		Assertions.assertEquals(7, updatedInventory.getAvailableQuantity());
	}

	@Test
	void contextLoads() {
	}

	private static String generateTestSecret() {
		byte[] secret = new byte[64];
		new SecureRandom().nextBytes(secret);
		return Base64.getEncoder().encodeToString(secret);
	}

}
