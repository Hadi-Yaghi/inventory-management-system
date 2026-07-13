package com.project.code.Repo;

import com.project.code.Model.Store;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;


@Repository
public interface StoreRepository  extends JpaRepository<Store,Long> {

    Store findByid(Long id);
    @Query("SELECT p FROM Store p WHERE LOWER(p.name) like CONCAT('%',:pname,'%') ")
    List<Store> findByName(String pname);


}
