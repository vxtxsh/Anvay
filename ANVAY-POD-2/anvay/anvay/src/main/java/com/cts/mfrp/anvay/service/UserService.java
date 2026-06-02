package com.cts.mfrp.anvay.service;

import com.cts.mfrp.anvay.dto.LoginRequest;
import com.cts.mfrp.anvay.dto.LoginResponse;
import com.cts.mfrp.anvay.dto.RegisterStudentRequest;

public interface UserService {
    LoginResponse login(LoginRequest request);
    LoginResponse registerStudent(RegisterStudentRequest request);
    void resetPassword(String email, String oldPasswordOrMaster, String newPassword);
}
