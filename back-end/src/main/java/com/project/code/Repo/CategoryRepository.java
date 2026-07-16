package com.project.code.Repo;

import com.project.code.Model.Category;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    @Cacheable(value = "categories", key = "'all'")
    List<Category> findAll();

    @Cacheable(value = "categories", key = "#id")
    Optional<Category> findById(Long id);

    Optional<Category> findByName(String name);
}
