package com.team20.pki.encryption.service;

import javax.crypto.SecretKey;

/**
 * Loads the master key used to encrypt (wrap) organization keys.
 * Implementations can read from env, KMS, HSM, etc.
 */
public interface MasterKeyProvider {
    SecretKey loadMasterKey();
}
