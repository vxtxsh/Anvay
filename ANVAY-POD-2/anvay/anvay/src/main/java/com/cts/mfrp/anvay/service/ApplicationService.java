package com.cts.mfrp.anvay.service;

import com.cts.mfrp.anvay.entity.LeadershipApplication;
import java.util.List;

public interface ApplicationService {
    LeadershipApplication createApplication(LeadershipApplication application);
    LeadershipApplication getApplicationById(Long applicationId);
    List<LeadershipApplication> getApplicationsByClubId(Long clubId);
    LeadershipApplication updateApplication(Long applicationId, LeadershipApplication application);
    void deleteApplication(Long applicationId);
}
