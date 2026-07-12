package com.project.code.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.frontend.url:http://localhost:5500,http://127.0.0.1:5500}")
    private String frontendUrl;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        String[] allowedOrigins = frontendUrl.split(",");
        // Allow CORS for all endpoints matching allowed origins
        registry.addMapping("/**")
                .allowedOrigins(allowedOrigins)  // Add your frontend URLs here
                .allowedMethods("GET", "POST", "PUT", "DELETE")  // Specify allowed methods
                .allowedHeaders("*");  // You can restrict headers if needed
    }
}
