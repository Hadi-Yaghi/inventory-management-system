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
		registry.add("spring.cache.type", () -> "none");
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

	@Autowired
	private PurchaseOrderService purchaseOrderService;

	@Autowired
	private StockTransferService stockTransferService;

	@Autowired
	private ReturnService returnService;

	@Autowired
	private SupplierRepository supplierRepository;

	@Autowired
	private UserRepository userRepository;

	@Autowired
	private OrderItemRepository orderItemRepository;

	@Autowired
	private ReturnRequestRepository returnRequestRepository;

	@Autowired
	private ActivityLogRepository activityLogRepository;

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
	@Transactional
	void testEventDrivenDecoupling() {
		// 1. Setup User and Supplier
		User user = new User();
		user.setUsername("testuser");
		user.setEmail("testuser@example.com");
		user.setPasswordHash("password");
		user.setRole(Role.ADMIN);
		user = userRepository.save(user);

		Supplier supplier = new Supplier();
		supplier.setName("Test Supplier");
		supplier.setContactEmail("supplier@example.com");
		supplier = supplierRepository.save(supplier);

		Store store1 = new Store();
		store1.setName("Store 1");
		store1.setAddress("123 Address 1");
		store1 = storeRepository.save(store1);

		Store store2 = new Store();
		store2.setName("Store 2");
		store2.setAddress("456 Address 2");
		store2 = storeRepository.save(store2);

		Product product = new Product();
		product.setName("Event Product");
		product.setSku("EVENT-SKU");
		product.setPrice(20.0);
		product = productRepository.save(product);

		// 2. Test PurchaseOrderReceivedEvent
		CreatePurchaseOrderDTO createPoDto = new CreatePurchaseOrderDTO();
		createPoDto.setSupplierId(supplier.getId());
		createPoDto.setStoreId(store1.getId());
		
		CreatePurchaseOrderItemDTO poItemDto = new CreatePurchaseOrderItemDTO();
		poItemDto.setProductId(product.getId());
		poItemDto.setQuantityOrdered(5);
		poItemDto.setUnitCost(15.0);
		createPoDto.setItems(List.of(poItemDto));

		PurchaseOrder po = purchaseOrderService.createPurchaseOrder(createPoDto, "testuser");
		Assertions.assertEquals(PurchaseOrderStatus.PENDING, po.getStatus());

		ReceiveItemDTO receiveDto = new ReceiveItemDTO();
		receiveDto.setProductId(product.getId());
		receiveDto.setQuantityReceived(5);

		purchaseOrderService.receiveShipment(po.getId(), List.of(receiveDto));

		// Verify stock level was updated by InventoryUpdateListener
		Inventory inv1 = inventoryRepository.findByProductIdAndStoreId(product.getId(), store1.getId());
		Assertions.assertNotNull(inv1);
		Assertions.assertEquals(5, inv1.getStockLevel());

		// Verify ActivityLog was created by ActivityLoggingListener
		boolean poLogExists = activityLogRepository.findAll().stream()
				.anyMatch(log -> log.getEntityType().equals("PurchaseOrder") 
						&& log.getEntityId().equals(String.valueOf(po.getId()))
						&& log.getDetails().contains("Received shipment"));
		Assertions.assertTrue(poLogExists);

		// 3. Test StockTransferredEvent
		StockTransfer transfer = stockTransferService.initiateTransfer(product.getId(), store1.getId(), store2.getId(), 2);
		
		// Verify source stock decremented by listener
		inv1 = inventoryRepository.findByProductIdAndStoreId(product.getId(), store1.getId());
		Assertions.assertEquals(3, inv1.getStockLevel());

		stockTransferService.confirmReceipt(transfer.getId());

		// Verify destination stock incremented by listener
		Inventory inv2 = inventoryRepository.findByProductIdAndStoreId(product.getId(), store2.getId());
		Assertions.assertNotNull(inv2);
		Assertions.assertEquals(2, inv2.getStockLevel());

		// Verify StockTransfer ActivityLog
		boolean transferLogExists = activityLogRepository.findAll().stream()
				.anyMatch(log -> log.getEntityType().equals("StockTransfer") 
						&& log.getEntityId().equals(String.valueOf(transfer.getId()))
						&& log.getDetails().contains("status is now COMPLETED"));
		Assertions.assertTrue(transferLogExists);
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
