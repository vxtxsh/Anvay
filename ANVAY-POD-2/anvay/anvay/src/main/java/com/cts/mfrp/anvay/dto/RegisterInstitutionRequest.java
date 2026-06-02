package com.cts.mfrp.anvay.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class RegisterInstitutionRequest {
    @NotBlank(message = "Institution name is required")
    private String institutionName;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password is required")
    private String password;

    @Pattern(regexp = "^[6-9][0-9]{9}$", message = "Phone must be a valid 10-digit Indian mobile number starting with 6-9")
    private String phone;
    private String address;

    // Admin user details
    @NotBlank(message = "Admin name is required")
    private String adminName;
}
