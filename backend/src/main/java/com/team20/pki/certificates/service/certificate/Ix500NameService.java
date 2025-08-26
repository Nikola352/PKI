package com.team20.pki.certificates.service.certificate;

import com.team20.pki.certificates.model.SubjectData;
import org.bouncycastle.asn1.x500.X500Name;

public interface Ix500NameService {
    public X500Name createX500Name(SubjectData subject) ;
    }
