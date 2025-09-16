package com.team20.pki.certificates.model;

import jakarta.persistence.Embeddable;
import jakarta.persistence.EntityNotFoundException;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.bouncycastle.asn1.x500.X500Name;

import javax.naming.InvalidNameException;
import javax.naming.ldap.LdapName;
import javax.naming.ldap.Rdn;
import java.util.Optional;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Embeddable
public class Issuer {
    protected String distinguishedName;

    public Issuer(X500Name x500Name) {
        this.distinguishedName = x500Name.toString();
    }

    public X500Name toX500Name() {
        return new X500Name(distinguishedName);
    }

    public String getOrganization() throws InvalidNameException {
        LdapName ldapName = new LdapName(distinguishedName);
        Optional<String> organization = ldapName.getRdns()
                .stream()
                .filter(rdn -> "O".equalsIgnoreCase(rdn.getType()))
                .map(rdn -> rdn.getValue().toString()).findFirst();
        return organization.orElseThrow(EntityNotFoundException::new);
    }

}
