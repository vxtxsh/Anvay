package com.cts.mfrp.anvay.service.impl;

import com.cts.mfrp.anvay.dto.LoginResponse;
import com.cts.mfrp.anvay.dto.RegisterInstitutionRequest;
import com.cts.mfrp.anvay.entity.Institution;
import com.cts.mfrp.anvay.entity.User;
import com.cts.mfrp.anvay.repository.InstitutionRepository;
import com.cts.mfrp.anvay.repository.UserRepository;
import com.cts.mfrp.anvay.security.JwtUtil;
import com.cts.mfrp.anvay.service.InstitutionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional
public class InstitutionServiceImpl implements InstitutionService {

    private final InstitutionRepository institutionRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Override
    public LoginResponse registerInstitution(RegisterInstitutionRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        Institution institution = new Institution();
        institution.setName(request.getInstitutionName());
        institution.setInstitutionEmail(request.getEmail());
        institution.setLocation(request.getAddress());
        institution.setStatus("pending");
        institution.setCreatedAt(LocalDateTime.now());
        institution.setUpdatedAt(LocalDateTime.now());
        Institution saved = institutionRepository.save(institution);

        User admin = User.builder()
                .firstName(request.getAdminName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role("institution")
                .institutionId(saved.getInstitutionId())
                .build();
        admin = userRepository.save(admin);

        String token = jwtUtil.generateToken(admin.getEmail(), admin.getRole(), admin.getUserId(), admin.getInstitutionId());
        return LoginResponse.builder()
                .token(token)
                .role(admin.getRole())
                .name(admin.getFirstName())
                .userId(admin.getUserId())
                .institutionId(admin.getInstitutionId())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Institution getInstitutionById(Long institutionId) {
        return institutionRepository.findById(institutionId)
                .orElseThrow(() -> new IllegalArgumentException("Institution not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Institution> getAllInstitutions() {
        return institutionRepository.findAll();
    }

    @Override
    public Institution updateInstitution(Long institutionId, Institution institution) {
        Institution existing = getInstitutionById(institutionId);
        if (institution.getName() != null) existing.setName(institution.getName());
        if (institution.getLocation() != null) existing.setLocation(institution.getLocation());
        if (institution.getInstitutionEmail() != null) existing.setInstitutionEmail(institution.getInstitutionEmail());
        if (institution.getStatus() != null) existing.setStatus(institution.getStatus());
        existing.setUpdatedAt(LocalDateTime.now());
        return institutionRepository.save(existing);
    }

    @Override
    public void deleteInstitution(Long institutionId) {
        institutionRepository.deleteById(institutionId);
    }
}
