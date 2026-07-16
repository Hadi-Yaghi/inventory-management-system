package com.project.code.Repo;

import com.project.code.Model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    @Query("SELECT n FROM Notification n WHERE n.recipient.id = :recipientId OR (n.store.id IN :storeIds AND n.recipient IS NULL) OR (n.store IS NULL AND n.recipient IS NULL)")
    List<Notification> findByUserAndStores(@Param("recipientId") Long recipientId, @Param("storeIds") Collection<Long> storeIds);

    @Query("SELECT n FROM Notification n WHERE n.store IS NULL AND n.recipient IS NULL")
    List<Notification> findGlobalNotifications();
}
