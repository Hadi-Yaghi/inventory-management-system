package com.project.code.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;
import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final UserDetailsService userDetailsService;
    private final CustomAuthenticationEntryPoint authenticationEntryPoint;
    private final CustomAccessDeniedHandler accessDeniedHandler;

    @Value("${app.frontend.url:http://localhost:5173,http://127.0.0.1:5173}")
    private String frontendUrl;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthFilter,
            UserDetailsService userDetailsService,
            CustomAuthenticationEntryPoint authenticationEntryPoint,
            CustomAccessDeniedHandler accessDeniedHandler) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.userDetailsService = userDetailsService;
        this.authenticationEntryPoint = authenticationEntryPoint;
        this.accessDeniedHandler = accessDeniedHandler;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .exceptionHandling(exception -> exception
                .authenticationEntryPoint(authenticationEntryPoint)
                .accessDeniedHandler(accessDeniedHandler)
            )
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers("/auth/login", "/auth/register", "/auth/google").permitAll()
                .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll()
                .requestMatchers("/uploads/**").permitAll()
                .requestMatchers("/error").permitAll()

                // Roles restrictions:
                // 1. User management is restricted to ADMIN
                .requestMatchers("/auth/users/**", "/users/**").hasRole("ADMIN")

                // 2. Employee-allowed specific mutations (MUST come before general store/product blocks)
                .requestMatchers(HttpMethod.POST, "/store/placeOrder").hasAnyRole("ADMIN", "MANAGER", "EMPLOYEE")
                .requestMatchers(HttpMethod.POST, "/inventory/adjustments/*/approve", "/inventory/adjustments/*/reject").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.POST, "/inventory/adjustments").hasAnyRole("ADMIN", "MANAGER", "EMPLOYEE")
                .requestMatchers(HttpMethod.GET, "/inventory/adjustments/**").hasAnyRole("ADMIN", "MANAGER", "EMPLOYEE")
                .requestMatchers(HttpMethod.POST, "/inventory/**").hasAnyRole("ADMIN", "MANAGER", "EMPLOYEE")
                .requestMatchers(HttpMethod.PUT, "/inventory/**").hasAnyRole("ADMIN", "MANAGER")

                // 2b. Notifications endpoints
                .requestMatchers("/notifications/**").hasAnyRole("ADMIN", "MANAGER", "EMPLOYEE")

                // 2c. Customers endpoints
                .requestMatchers("/customers/**").hasAnyRole("ADMIN", "MANAGER", "EMPLOYEE")

                // 3. Deletions on products, stores, and inventory are restricted to ADMIN, MANAGER
                .requestMatchers(HttpMethod.DELETE, "/product/**").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.DELETE, "/store/**").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.DELETE, "/inventory/**").hasAnyRole("ADMIN", "MANAGER")

                // 4. Mutations on products and stores (POST/PUT) are restricted to ADMIN, MANAGER
                .requestMatchers(HttpMethod.POST, "/product/**").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.PUT, "/product/**").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.POST, "/store/**").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.PUT, "/store/**").hasAnyRole("ADMIN", "MANAGER")

                // 5. Category writes restricted to ADMIN, MANAGER; Supplier writes restricted to ADMIN only
                .requestMatchers(HttpMethod.POST, "/category/**").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.PUT, "/category/**").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.DELETE, "/category/**").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.POST, "/supplier/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/supplier/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/supplier/**").hasRole("ADMIN")

                // 5.1 Purchase Order writes (POST/PUT/DELETE) restricted to ADMIN, MANAGER
                .requestMatchers(HttpMethod.POST, "/purchase-orders/**").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.PUT, "/purchase-orders/**").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.DELETE, "/purchase-orders/**").hasAnyRole("ADMIN", "MANAGER")

                // 6. Stock Transfers
                .requestMatchers(HttpMethod.POST, "/transfers/initiate").hasAnyRole("ADMIN", "MANAGER", "EMPLOYEE")
                .requestMatchers(HttpMethod.POST, "/transfers/*/confirm").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.POST, "/transfers/*/cancel").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.GET, "/transfers/**").hasAnyRole("ADMIN", "MANAGER", "EMPLOYEE")

                // 7. Image file upload mutations restricted to ADMIN, MANAGER
                .requestMatchers(HttpMethod.POST, "/uploads").hasAnyRole("ADMIN", "MANAGER")

                // 8. Order Status Tracking
                .requestMatchers(HttpMethod.PUT, "/orders/*/status").hasAnyRole("ADMIN", "MANAGER")

                // 9. Returns & Refunds
                .requestMatchers(HttpMethod.POST, "/returns/request").hasAnyRole("ADMIN", "MANAGER", "EMPLOYEE")
                .requestMatchers(HttpMethod.POST, "/returns/*/approve", "/returns/*/reject").hasAnyRole("ADMIN", "MANAGER")

                // 10. Reviews mutations
                .requestMatchers(HttpMethod.POST, "/reviews").hasAnyRole("ADMIN", "MANAGER", "EMPLOYEE")
                .requestMatchers(HttpMethod.POST, "/reviews/*/like", "/reviews/*/reply").hasAnyRole("ADMIN", "MANAGER", "EMPLOYEE")

                // 11. Admin Activity Logs (ADMIN only)
                .requestMatchers("/admin/activity-logs/**").hasRole("ADMIN")

                // 12. Analytics Dashboard & Reports (ADMIN, MANAGER)
                .requestMatchers("/analytics/**").hasAnyRole("ADMIN", "MANAGER")

                // 13. Read access everywhere
                .requestMatchers(HttpMethod.GET, "/**").hasAnyRole("ADMIN", "MANAGER", "EMPLOYEE")

                // Any other request must be authenticated
                .anyRequest().authenticated()
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> allowedOrigins = Arrays.stream(frontendUrl.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .toList();
        configuration.setAllowedOrigins(allowedOrigins);
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept", "X-Requested-With"));
        configuration.setExposedHeaders(Arrays.asList("Authorization"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
