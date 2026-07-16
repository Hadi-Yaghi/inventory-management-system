package com.project.code.Repo;

import com.project.code.Model.Supplier;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface SupplierRepository extends JpaRepository<Supplier, Long> {

    @Cacheable(value = "suppliers", key = "'all'")
    List<Supplier> findAll();

    @Cacheable(value = "suppliers", key = "#id")
    Optional<Supplier> findById(Long id);
}
