package com.project.code.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.frontend.url:http://localhost:5173,http://127.0.0.1:5173}")
    private String frontendUrl;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        String[] allowedOrigins = java.util.Arrays.stream(frontendUrl.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .toArray(String[]::new);
        // Allow CORS for all endpoints matching allowed origins
        registry.addMapping("/**")
                .allowedOrigins(allowedOrigins)  // Add your frontend URLs here
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")  // Specify allowed methods
                .allowedHeaders("*");  // You can restrict headers if needed
    }

    @Override
    public void addResourceHandlers(org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry registry) {
        java.nio.file.Path path = java.nio.file.Paths.get(uploadDir).toAbsolutePath().normalize();
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + path.toString() + "/");
    }
}
