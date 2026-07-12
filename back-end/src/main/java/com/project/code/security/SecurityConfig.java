package com.project.code.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final UserDetailsService userDetailsService;
    private final CustomAuthenticationEntryPoint authenticationEntryPoint;
    private final CustomAccessDeniedHandler accessDeniedHandler;

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
                .requestMatchers("/auth/login", "/auth/register").permitAll()
                .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll()
                .requestMatchers("/uploads/**").permitAll()
                .requestMatchers("/error").permitAll()

                // Roles restrictions:
                // 1. User management is restricted to ADMIN
                .requestMatchers("/auth/users/**", "/users/**").hasRole("ADMIN")

                // 2. Deletions on products and stores and inventory are restricted to ADMIN, MANAGER
                .requestMatchers(HttpMethod.DELETE, "/product/**").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.DELETE, "/store/**").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.DELETE, "/inventory/**").hasAnyRole("ADMIN", "MANAGER")

                // 3. Mutations on products and stores (POST/PUT) are restricted to ADMIN, MANAGER
                .requestMatchers(HttpMethod.POST, "/product/**").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.PUT, "/product/**").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.POST, "/store/**").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.PUT, "/store/**").hasAnyRole("ADMIN", "MANAGER")

                // 4. Employee is allowed to create orders (POST /store/placeOrder) and update inventory (POST/PUT /inventory)
                .requestMatchers(HttpMethod.POST, "/store/placeOrder").hasAnyRole("ADMIN", "MANAGER", "EMPLOYEE")
                .requestMatchers(HttpMethod.POST, "/inventory/**").hasAnyRole("ADMIN", "MANAGER", "EMPLOYEE")
                .requestMatchers(HttpMethod.PUT, "/inventory/**").hasAnyRole("ADMIN", "MANAGER", "EMPLOYEE")

                // 5. Category and Supplier writes (POST/PUT/DELETE) restricted to ADMIN, MANAGER
                .requestMatchers(HttpMethod.POST, "/category/**", "/supplier/**").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.PUT, "/category/**", "/supplier/**").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.DELETE, "/category/**", "/supplier/**").hasAnyRole("ADMIN", "MANAGER")

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

                // 11. Read access everywhere
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
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:5500", "http://127.0.0.1:5500"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept", "X-Requested-With"));
        configuration.setExposedHeaders(Arrays.asList("Authorization"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
