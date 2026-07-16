package com.project.code.Repo;

import com.project.code.Model.Customer;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerRepository extends JpaRepository<Customer, Long> {

      Customer findByEmail(String email);

      Customer findByid(Long id);

      @org.springframework.data.jpa.repository.Query("SELECT DISTINCT c FROM Customer c JOIN c.orders o WHERE o.store.id IN :storeIds")
      java.util.List<Customer> findCustomersByStores(@org.springframework.data.repository.query.Param("storeIds") java.util.Collection<Long> storeIds);
}