package com.team20.pki.certificates.repository;

import com.team20.pki.certificates.model.Certificate;
import com.team20.pki.certificates.model.CertificateType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface ICertificateRepository extends JpaRepository<Certificate, UUID> {
    List<Certificate> findCertificatesByTypeIn(Collection<CertificateType> types);

    @Query("select c from Certificate c where c.owner.id =:id")
    List<Certificate> findByOwnerId(@Param("id") UUID id);

    @Query("SELECT COUNT(c) FROM Certificate c WHERE c.parent.owner.id = :id")
    int countIssuedCertificatesByParentId(@Param("id") UUID id);

    List<Certificate> findAllByParent_Id(UUID parentId);

    List<Certificate> findByType(CertificateType type);

    @Query("""
    SELECT c
    FROM Certificate c
    LEFT JOIN c.parent p
    LEFT JOIN p.owner po
    WHERE c.owner.id = :caId
      AND (
          c.type = com.team20.pki.certificates.model.CertificateType.ROOT
          OR (
              c.type = com.team20.pki.certificates.model.CertificateType.INTERMEDIATE
              AND po.id <> :caId
          )
      )
    """)
    List<Certificate> findCaRoots(@Param("caId") UUID caId);


}
