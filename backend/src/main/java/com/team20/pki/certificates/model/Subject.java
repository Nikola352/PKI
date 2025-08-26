package com.team20.pki.certificates.model;

import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.bouncycastle.asn1.x500.X500Name;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Embeddable
public class Subject  {
    protected String distinguishedName;
    public  Subject(X500Name x500Name){
        this.distinguishedName = x500Name.toString();
    }
    public X500Name toX500Name(){
        return  new X500Name(distinguishedName);
    }
}
