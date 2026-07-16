package com.project.code.Service;

import com.project.code.Model.Notification;
import com.project.code.Model.Store;
import com.project.code.Model.User;
import com.project.code.Repo.NotificationRepository;
import com.project.code.exception.NotFoundException;
import com.project.code.security.SecurityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private SecurityService securityService;

    @Transactional
    public Notification createNotification(String title, String message, Store store, User recipient) {
        Notification notification = new Notification(title, message, store, recipient);
        return notificationRepository.save(notification);
    }

    public List<Notification> getUserNotifications() {
        User user = securityService.getCurrentUser();
        if (securityService.isUserAdmin()) {
            return notificationRepository.findAll();
        } else {
            Set<Long> storeIds = securityService.getAssignedStoreIds();
            return notificationRepository.findByUserAndStores(user.getId(), storeIds);
        }
    }

    @Transactional
    public void markAsRead(Long id) {
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Notification not found with ID: " + id));
        n.setRead(true);
        notificationRepository.save(n);
    }
}
