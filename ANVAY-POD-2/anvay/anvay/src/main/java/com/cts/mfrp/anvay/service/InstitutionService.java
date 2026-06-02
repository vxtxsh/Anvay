package com.cts.mfrp.anvay.service;

import com.cts.mfrp.anvay.dto.LoginResponse;
import com.cts.mfrp.anvay.dto.RegisterInstitutionRequest;
import com.cts.mfrp.anvay.entity.Institution;

import java.util.List;

public interface InstitutionService {
    LoginResponse registerInstitution(RegisterInstitutionRequest request);
    Institution getInstitutionById(Long institutionId);
    List<Institution> getAllInstitutions();
    Institution updateInstitution(Long institutionId, Institution institution);
    void deleteInstitution(Long institutionId);
}
