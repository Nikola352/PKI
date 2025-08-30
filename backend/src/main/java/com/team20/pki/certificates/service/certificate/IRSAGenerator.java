package com.team20.pki.certificates.service.certificate;

import java.security.KeyPair;
import java.security.NoSuchAlgorithmException;

public interface IRSAGenerator {
    KeyPair generateKeyPair() throws NoSuchAlgorithmException;
}
