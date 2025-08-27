package com.team20.pki.certificates.service.certificate;

import com.team20.pki.certificates.dto.CaSignSubjectDataDTO;
import com.team20.pki.certificates.dto.SelfSignSubjectDataDTO;
import org.bouncycastle.asn1.x500.X500Name;

public interface Ix500NameService {
    public X500Name createX500Name(SelfSignSubjectDataDTO subject) ;
    X500Name createX500Name(CaSignSubjectDataDTO subject);
    }
