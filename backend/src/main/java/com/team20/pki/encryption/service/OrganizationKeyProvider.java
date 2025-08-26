package com.team20.pki.encryption.service;

import javax.crypto.SecretKey;

/**
 * Returns or creates organization-specific key.
 * It <b>must</b> return an AES key for symmetric encryption, but can use/store any other keys under the hood.
 * It is <b>highly</b> advised to use {@link MasterKeyProvider} for internal key encryption.
 */
public interface OrganizationKeyProvider {
    /**
     * Returns organization key (existing or newly created).
     */
    SecretKey getOrCreateOrganizationKey(String organization);
}
