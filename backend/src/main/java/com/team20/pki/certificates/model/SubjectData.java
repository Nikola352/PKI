package com.team20.pki.certificates.model;

import lombok.Value;

@Value
public class SubjectData {
    public String country;
    public String state;
    public String locality;
    public String street;
    public String organization;
    public String organizationalUnit;
    public String commonName;
    public String surname;
    public String givenName;
    public String initials;
    public String generationQualifier;
    public String title;
    public String serialNumber;
    public String pseudonym;
    public String emailAddress;
}
