package com.team20.pki.certificates.service.certificate.impl;

import com.team20.pki.certificates.model.SubjectData;
import com.team20.pki.certificates.service.certificate.Ix500NameService;
import org.bouncycastle.asn1.x500.X500Name;
import org.bouncycastle.asn1.x500.X500NameBuilder;
import org.bouncycastle.asn1.x500.style.BCStyle;
import org.springframework.stereotype.Service;


@Service
public class X500NameService implements Ix500NameService {

    public X500Name createX500Name(SubjectData subject) {
        X500NameBuilder builder = new X500NameBuilder(BCStyle.INSTANCE);

        if (subject.country != null) builder.addRDN(BCStyle.C, subject.country);
        if (subject.state != null) builder.addRDN(BCStyle.ST, subject.state);
        if (subject.locality != null) builder.addRDN(BCStyle.L, subject.locality);
        if (subject.street != null) builder.addRDN(BCStyle.STREET, subject.street);
        if (subject.organization != null) builder.addRDN(BCStyle.O, subject.organization);
        if (subject.organizationalUnit != null) builder.addRDN(BCStyle.OU, subject.organizationalUnit);
        if (subject.commonName != null) builder.addRDN(BCStyle.CN, subject.commonName);
        if (subject.surname != null) builder.addRDN(BCStyle.SURNAME, subject.surname);
        if (subject.givenName != null) builder.addRDN(BCStyle.GIVENNAME, subject.givenName);
        if (subject.initials != null) builder.addRDN(BCStyle.INITIALS, subject.initials);
        if (subject.generationQualifier != null) builder.addRDN(BCStyle.GENERATION, subject.generationQualifier);
        if (subject.title != null) builder.addRDN(BCStyle.T, subject.title);
        if (subject.serialNumber != null) builder.addRDN(BCStyle.SERIALNUMBER, subject.serialNumber);
        if (subject.pseudonym != null) builder.addRDN(BCStyle.PSEUDONYM, subject.pseudonym);
        if (subject.emailAddress != null) builder.addRDN(BCStyle.EmailAddress, subject.emailAddress);

        return builder.build();
    }
}
