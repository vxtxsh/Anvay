package com.cts.mfrp.anvay.config;

import com.cts.mfrp.anvay.entity.User;
import com.cts.mfrp.anvay.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.superadmin.name}")
    private String superAdminName;

    @Value("${app.superadmin.email}")
    private String superAdminEmail;

    @Value("${app.superadmin.password}")
    private String superAdminPassword;

    @Override
    public void run(String... args) {
        if (!userRepository.existsByEmail(superAdminEmail)) {
            User superAdmin = User.builder()
                    .firstName(superAdminName)
                    .email(superAdminEmail)
                    .password(passwordEncoder.encode(superAdminPassword))
                    .role("super_admin")
                    .institutionId(null)
                    .build();
            userRepository.save(superAdmin);
            log.info("Super Admin created: {}", superAdminEmail);
        } else {
            // Update password every time to keep it in sync with properties
            User superAdmin = userRepository.findByEmail(superAdminEmail).get();
            superAdmin.setPassword(passwordEncoder.encode(superAdminPassword));
            superAdmin.setFirstName(superAdminName);
            userRepository.save(superAdmin);
            log.info("Super Admin password updated: {}", superAdminEmail);
        }
    }
}
