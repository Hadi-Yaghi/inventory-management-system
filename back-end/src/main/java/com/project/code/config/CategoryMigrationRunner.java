package com.project.code.config;

import com.project.code.Model.Category;
import com.project.code.Repo.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class CategoryMigrationRunner implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private CategoryRepository categoryRepository;

    @Override
    public void run(String... args) throws Exception {
        try {
            // Check if product table has category column containing string data and category_id is not set
            List<Map<String, Object>> productsToMigrate = jdbcTemplate.queryForList(
                "SELECT id, category FROM product WHERE category IS NOT NULL AND category_id IS NULL"
            );

            for (Map<String, Object> prod : productsToMigrate) {
                Long productId = ((Number) prod.get("id")).longValue();
                String categoryName = (String) prod.get("category");

                if (categoryName != null && !categoryName.trim().isEmpty()) {
                    Category category = categoryRepository.findByName(categoryName)
                        .orElseGet(() -> {
                            Category newCat = new Category();
                            newCat.setName(categoryName);
                            newCat.setDescription("Migrated category: " + categoryName);
                            return categoryRepository.save(newCat);
                        });

                    jdbcTemplate.update(
                        "UPDATE product SET category_id = ? WHERE id = ?",
                        category.getId(), productId
                    );
                }
            }

            System.out.println("Category migration runner: successfully migrated old category strings to Category entities.");

        } catch (Exception e) {
            // The column 'category' might not exist anymore or migration was already done
            System.out.println("Category migration runner message (no action needed if category column doesn't exist): " + e.getMessage());
        }
    }
}
