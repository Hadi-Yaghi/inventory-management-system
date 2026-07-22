package com.project.code.security;

import org.springframework.beans.factory.annotation.Value;
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
import java.util.List;

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
                .requestMatchers("/auth/accept-invitation", "/actuator/health").permitAll()
                .requestMatchers("/organizations/public/invitation/**").permitAll()
                .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll()
                .requestMatchers("/uploads/**").permitAll()
                .requestMatchers("/error").permitAll()

                // User & Organization endpoints
                .requestMatchers("/auth/users/**", "/users/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/organizations/current", "/organizations/members").hasAnyRole("ADMIN", "MANAGER", "EMPLOYEE")
                .requestMatchers("/organizations/**").hasAnyRole("ADMIN", "MANAGER")

                // Specific mutation permissions
                .requestMatchers(HttpMethod.POST, "/store/placeOrder").hasAnyRole("ADMIN", "MANAGER", "EMPLOYEE")
                .requestMatchers(HttpMethod.POST, "/inventory/adjustments/*/approve", "/inventory/adjustments/*/reject").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.POST, "/inventory/adjustments").hasAnyRole("ADMIN", "MANAGER", "EMPLOYEE")
                .requestMatchers(HttpMethod.GET, "/inventory/adjustments/**").hasAnyRole("ADMIN", "MANAGER", "EMPLOYEE")
                .requestMatchers(HttpMethod.POST, "/inventory/**").hasAnyRole("ADMIN", "MANAGER", "EMPLOYEE")
                .requestMatchers(HttpMethod.PUT, "/inventory/**").hasAnyRole("ADMIN", "MANAGER")

                .requestMatchers("/notifications/**").hasAnyRole("ADMIN", "MANAGER", "EMPLOYEE")
                .requestMatchers("/customers/**").hasAnyRole("ADMIN", "MANAGER", "EMPLOYEE")

                .requestMatchers(HttpMethod.DELETE, "/product/**").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.DELETE, "/store/**").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.DELETE, "/inventory/**").hasAnyRole("ADMIN", "MANAGER")

                .requestMatchers(HttpMethod.POST, "/product/**").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.PUT, "/product/**").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.POST, "/store/**").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.PUT, "/store/**").hasAnyRole("ADMIN", "MANAGER")

                .requestMatchers(HttpMethod.POST, "/category/**").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.PUT, "/category/**").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.DELETE, "/category/**").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.POST, "/supplier/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/supplier/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/supplier/**").hasRole("ADMIN")

                .requestMatchers(HttpMethod.POST, "/purchase-orders/**").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.PUT, "/purchase-orders/**").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.DELETE, "/purchase-orders/**").hasAnyRole("ADMIN", "MANAGER")

                .requestMatchers(HttpMethod.POST, "/transfers/initiate").hasAnyRole("ADMIN", "MANAGER", "EMPLOYEE")
                .requestMatchers(HttpMethod.POST, "/transfers/*/confirm").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.POST, "/transfers/*/cancel").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.GET, "/transfers/**").hasAnyRole("ADMIN", "MANAGER", "EMPLOYEE")

                .requestMatchers(HttpMethod.POST, "/uploads").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.PUT, "/orders/*/status").hasAnyRole("ADMIN", "MANAGER")

                .requestMatchers(HttpMethod.POST, "/returns/request").hasAnyRole("ADMIN", "MANAGER", "EMPLOYEE")
                .requestMatchers(HttpMethod.POST, "/returns/*/approve", "/returns/*/reject").hasAnyRole("ADMIN", "MANAGER")

                .requestMatchers(HttpMethod.POST, "/reviews").hasAnyRole("ADMIN", "MANAGER", "EMPLOYEE")
                .requestMatchers(HttpMethod.POST, "/reviews/*/like", "/reviews/*/reply").hasAnyRole("ADMIN", "MANAGER", "EMPLOYEE")

                .requestMatchers("/admin/activity-logs/**").hasRole("ADMIN")
                .requestMatchers("/analytics/**").hasAnyRole("ADMIN", "MANAGER")

                .requestMatchers(HttpMethod.GET, "/**").hasAnyRole("ADMIN", "MANAGER", "EMPLOYEE")
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
        configuration.setAllowedOriginPatterns(List.of("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept", "X-Requested-With", "X-Active-Store-ID", "Origin"));
        configuration.setExposedHeaders(Arrays.asList("Authorization"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
