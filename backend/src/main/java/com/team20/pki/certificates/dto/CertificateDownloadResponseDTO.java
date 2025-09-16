package com.team20.pki.certificates.dto;

public record CertificateDownloadResponseDTO(
    byte[] certificateBytes,
    String fileName
){

}