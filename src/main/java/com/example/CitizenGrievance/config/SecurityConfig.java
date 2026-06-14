package com.example.CitizenGrievance.config;

import com.example.CitizenGrievance.JWTAuthenticationProvider;
import com.example.CitizenGrievance.UserTypeAwareDaoProvider;
import com.example.CitizenGrievance.filters.JWTAuthenticationFilter;
import com.example.CitizenGrievance.filters.JwtValidationFilter;
import com.example.CitizenGrievance.util.JWTUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
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

    @Autowired private JWTUtil jwtUtil;

    @Qualifier("administrationService")
    @Autowired private UserDetailsService administrationService;

    @Qualifier("userEntityService")
    @Autowired private UserDetailsService userEntityService;   // ✅ new

    @Bean
    public UserTypeAwareDaoProvider userTypeAwareDaoProvider() {
        return new UserTypeAwareDaoProvider(
                administrationService,
                userEntityService,
                passwordEncoder()
        );
    }

    @Bean
    public JWTAuthenticationProvider jwtAuthenticationProvider() {
        return new JWTAuthenticationProvider(
                jwtUtil,
                administrationService,   // ✅ pass admin service
                userEntityService        // ✅ pass user service
        );
    }

    @Bean
    public AuthenticationManager authenticationManager() {
        return new ProviderManager(Arrays.asList(
                userTypeAwareDaoProvider(),    // ✅ handles login (both admin + user)
                jwtAuthenticationProvider()    // ✅ handles JWT validation
        ));
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        AuthenticationManager authManager = authenticationManager();

        JWTAuthenticationFilter jwtAuthFilter =
                new JWTAuthenticationFilter(authManager, jwtUtil);
        JwtValidationFilter jwtValidationFilter =
                new JwtValidationFilter(authManager);

        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/public/**").permitAll()  // ✅ add this
                        .requestMatchers("/ws/**").permitAll()       // ✅ WebSocket
                        // ✅ Admin registration — public
                        .requestMatchers("/register/admin/initiate").permitAll()
                        .requestMatchers("/register/admin/verify").permitAll()

                        // ✅ User registration — public
                        .requestMatchers("/register/user/initiate").permitAll()
                        .requestMatchers("/register/user/verify").permitAll()

                        // ✅ Login — public
                        .requestMatchers("/generate-token").permitAll()

                        // ✅ Admin protected endpoints
                        .requestMatchers("/admin/complaints").hasRole("ADMIN")
                        .requestMatchers("/admin/complaint/resolve/**").hasRole("ADMIN")
                        .requestMatchers("/admin/profile").hasRole("ADMIN")
                        .requestMatchers("/admin/myStats").hasRole("ADMIN")  // ✅ add this

                        // ✅ Citizen protected endpoints
                        .requestMatchers("/citizen/complaint").hasRole("USER")
                        .requestMatchers("/citizen/getMyComplaints").hasRole("USER")
                        .requestMatchers("/citizen/myStats").hasRole("USER")
                        .requestMatchers("/citizen/profile").hasRole("USER")
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter,
                        UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(jwtValidationFilter,
                        JWTAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of("http://localhost:5173"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(true);  // needed because you send cookies/auth headers

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

}
