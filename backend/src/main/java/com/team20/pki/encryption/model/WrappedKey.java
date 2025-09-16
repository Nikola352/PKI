package com.team20.pki.encryption.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.Lob;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Embeddable
public class WrappedKey {
    @Lob
    @Column(name = "wrapped_key", nullable = false)
    byte[] cipherText;

    @Lob
    @Column(name = "wrapped_key_iv", nullable = false)
    byte[] iv;
}
