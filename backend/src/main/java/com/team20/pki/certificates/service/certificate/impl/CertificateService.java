package com.team20.pki.certificates.service.certificate.impl;

import com.team20.pki.authentication.model.UserDetailsImpl;
import com.team20.pki.certificates.dto.*;
import com.team20.pki.certificates.mapper.CertificateMapper;
import com.team20.pki.certificates.model.Certificate;
import com.team20.pki.certificates.model.CertificateType;
import com.team20.pki.certificates.model.Issuer;
import com.team20.pki.certificates.model.Subject;
import com.team20.pki.certificates.repository.ICertificateRepository;
import com.team20.pki.certificates.service.certificate.ICertificateFactory;
import com.team20.pki.certificates.service.certificate.ICertificateService;
import com.team20.pki.certificates.service.certificate.IRSAGenerator;
import com.team20.pki.certificates.service.certificate.Ix500NameService;
import com.team20.pki.certificates.service.certificate.util.*;
import com.team20.pki.common.model.User;
import com.team20.pki.common.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.bouncycastle.asn1.x500.RDN;
import org.bouncycastle.asn1.x500.X500Name;
import org.bouncycastle.asn1.x500.style.BCStyle;
import org.bouncycastle.asn1.x500.style.IETFUtils;
import org.bouncycastle.asn1.x509.SubjectPublicKeyInfo;
import org.bouncycastle.openssl.PEMParser;
import org.bouncycastle.openssl.jcajce.JcaPEMKeyConverter;
import org.bouncycastle.operator.OperatorCreationException;
import org.bouncycastle.operator.jcajce.JcaContentVerifierProviderBuilder;
import org.bouncycastle.pkcs.PKCS10CertificationRequest;
import org.bouncycastle.pkcs.PKCSException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.crypto.BadPaddingException;
import javax.crypto.IllegalBlockSizeException;
import javax.crypto.NoSuchPaddingException;
import javax.naming.InvalidNameException;
import java.io.IOException;
import java.io.StringReader;
import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.security.cert.CertificateException;
import java.security.cert.X509Certificate;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CertificateService implements ICertificateService {
    private final ICertificateRepository certificateRepository;
    private final CertificateGenerator generator;
    private final CertificateToPEMConverter pemConverter;
    private final Ix500NameService x500NameService;
    private final IRSAGenerator rsaGenerator;
    private final KeyStoreService keyStoreService;
    private final KeyStorePasswordGenerator keyStorePasswordGenerator;
    private final UserRepository userRepository;
    private final ICertificateFactory certificateFactory;
    private final PasswordStorage passwordStorage;
    private final CertificateMapper certificateMapper;

    @Transactional
    public CertificateSelfSignResponseDTO generateSelfSignedCertificate(SelfSignSubjectDataDTO selfSignSubjectDataDTO) throws IOException, NoSuchAlgorithmException, CertificateException, KeyStoreException, InvalidAlgorithmParameterException, NoSuchPaddingException, IllegalBlockSizeException, BadPaddingException, InvalidKeyException {

        User user = userRepository.findById(selfSignSubjectDataDTO.subjectId()).orElseThrow(() -> new EntityNotFoundException("User not found"));
        X500Name name = x500NameService.createX500Name(selfSignSubjectDataDTO);

        BigInteger serial = generateSerialNumber();
        KeyPair keyPair = rsaGenerator.generateKeyPair();
        X509Certificate cert = generator.generateSelfSignedCertificate(serial, keyPair);
        LocalDate from = LocalDateTime.parse(selfSignSubjectDataDTO.validFrom()).toLocalDate();
        LocalDate to = LocalDateTime.parse(selfSignSubjectDataDTO.validTo()).toLocalDate();

        if (from.isAfter(to))
            throw new IllegalArgumentException("Certificate cannot last longer that its parent CA");

        Certificate certificate = certificateFactory.createCertificate(
                CertificateType.ROOT,
                serial.toString(),
                pemConverter.convertToPEM(cert),
                from,
                to,
                null,
                new Issuer(name),
                new Subject(name),
                user
        );
        persistCertificate(selfSignSubjectDataDTO.o(), keyPair, cert, certificate);
        return new CertificateSelfSignResponseDTO(certificate.getId());
    }

    @Transactional
    @Override
    public CertificateCaSignResponseDTO generateCaSignedCertificate(CaSignSubjectDataDTO dto) throws NoSuchAlgorithmException, IOException, CertificateException, KeyStoreException, InvalidAlgorithmParameterException, NoSuchPaddingException, IllegalBlockSizeException, BadPaddingException, InvalidKeyException, InvalidNameException {
        Certificate caCertificate = certificateRepository.findById(dto.caId()).orElseThrow(() -> new EntityNotFoundException("CA Not found"));
        User subjectUser = userRepository.findById(dto.subjectId()).orElseThrow(() -> new EntityNotFoundException("Subject user not found!"));
        X500Name subjectName = x500NameService.createX500Name(dto);
        Subject subject = new Subject(subjectName);
        CertificateType certificateType = declareCertificateType(subjectUser.getRole());

        BigInteger serialNumber = generateSerialNumber();

        LocalDate today = LocalDate.now();
        LocalDate withDays = today.plusDays(dto.validityDays());
        if (withDays.isAfter(caCertificate.getValidTo()))
            throw new IllegalArgumentException("Certificate cannot last longer that its parent CA");

        KeyPair keyPair = rsaGenerator.generateKeyPair();

        PrivateKey parentPrivateKey = loadParentPrivateKey(caCertificate);

        X509Certificate cert = generator.generateCertificate(subject, parentPrivateKey, caCertificate, today, withDays, serialNumber.toString());

        String pemFile = pemConverter.convertToPEM(cert);

        User user = userRepository.findById(dto.subjectId()).orElseThrow(EntityNotFoundException::new);

        Certificate certificate = certificateFactory.createCertificate(
                certificateType,
                cert.getSerialNumber().toString(),
                pemFile,
                today,
                withDays,
                caCertificate,
                caCertificate.getIssuer()
                , subject,
                user);

        persistCertificate(dto.o(), keyPair, cert, certificate);
        return new CertificateCaSignResponseDTO(certificate.getId());

    }

    @Override
    public CertificateGetResponseDTO getCertificateById(UUID id) {
        Certificate pemContent = certificateRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("Not Found"));
        return new CertificateGetResponseDTO(pemContent.getPemFile());
    }

    @Override
    public List<CAResponseDTO> getCertificateAuthorities(UserDetailsImpl userDetails) {
        User subject = userRepository.findById(userDetails.getUserId()).orElseThrow(() -> new EntityNotFoundException("Issuer not found"));
        List<Certificate> userOwnedCertificates = certificateRepository.findByOwnerId(subject.getId());
        List<Certificate> recursiveResult = new ArrayList<>();
        for (Certificate cert : userOwnedCertificates) {
            recursiveResult.add(cert);
            recursiveResult.addAll(getAllDescendants(cert.getId()));
        }

        List<CAResponseDTO> responses = recursiveResult.stream().map(certificate -> {
            Subject sub = certificate.getSubject();
            X500Name name = sub.toX500Name();
            RDN[] cnRdns = name.getRDNs(BCStyle.CN);
            String commonName = cnRdns.length > 0
                    ? IETFUtils.valueToString(cnRdns[0].getFirst().getValue())
                    : "";
            String caName = commonName + " CA";

            LocalDate today = LocalDate.now();

            long maxValidity = ChronoUnit.DAYS.between(today, certificate.getValidTo());

            return new CAResponseDTO(certificate.getId(), caName, maxValidity, 1, 1);
        }).toList();
        return responses.stream().collect(Collectors.collectingAndThen(
                Collectors.toMap(
                        CAResponseDTO::id,
                        c -> c,
                        (existing, replacement) -> existing
                ),
                map -> new ArrayList<>(map.values())
        ));
    }

    private List<Certificate> getAllDescendants(UUID parentId) {
        List<Certificate> result = new ArrayList<>();
        List<Certificate> children = certificateRepository.findAllByParent_Id(parentId);
        for (Certificate child : children) {
            if (child.getType().equals(CertificateType.END_ENTITY))
                continue;
            result.add(child);
            result.addAll(getAllDescendants(child.getId()));
        }
        return result;
    }

    @Override
    public List<CAResponseDTO> getCertificateAuthorities(UUID subjectId) {
        User subject = userRepository.findById(subjectId).orElseThrow(() -> new EntityNotFoundException("Subject not found"));
        List<Certificate> CAs = certificateRepository.findCertificatesByTypeIn(List.of(CertificateType.ROOT, CertificateType.INTERMEDIATE));
        CAs = CAs.stream().filter(certificate -> {
            try {
                return certificate.getSubject().getOrganization().equalsIgnoreCase(subject.getOrganization());
            } catch (InvalidNameException e) {
                throw new EntityNotFoundException("Subject not found");
            }
        }).toList();
        return CAs.stream().map(certificate -> {
            Subject sub = certificate.getSubject();
            X500Name name = sub.toX500Name();
            RDN[] cnRdns = name.getRDNs(BCStyle.CN);
            String commonName = cnRdns.length > 0
                    ? IETFUtils.valueToString(cnRdns[0].getFirst().getValue())
                    : "";
            String caName = commonName + " CA";

            LocalDate today = LocalDate.now();

            long maxValidity = ChronoUnit.DAYS.between(today, certificate.getValidTo());

            return new CAResponseDTO(certificate.getId(), caName, maxValidity, 1, 1);
        }).toList();
    }

    @Override
    public List<CertificateResponseDto> getUserCertificates(UUID userId) {
        return certificateRepository.findByOwnerId(userId).stream().map(certificateMapper::toDto).toList();
    }

    @Override
    @Transactional
    public List<CertificateNodeResponseDto> getAllCertificates() {
        final List<Certificate> roots = certificateRepository.findByType(CertificateType.ROOT);
        return roots.stream().map(this::getSubtree).toList();
    }

    @Override
    @Transactional
    public List<CertificateNodeResponseDto> getCaCertificates(UUID userId) {
        final List<Certificate> roots = certificateRepository.findCaRoots(userId);
        return roots.stream().map(this::getSubtree).toList();
    }

    @Override
    public RootsExistResponse rootsExistsForUser(UUID id) {
        return new RootsExistResponse(certificateRepository.existsCertificateByOwnerId(id));
    }

    private CertificateNodeResponseDto getSubtree(Certificate certificate) {
        final List<Certificate> children = certificateRepository.findAllByParent_Id(certificate.getId());
        return new CertificateNodeResponseDto(
                certificateMapper.toDto(certificate),
                children.stream().map(this::getSubtree).toList()
        );
    }

    @Override
    public CertificateDownloadResponseDTO downloadCertificateForUser(UUID id) {
        Certificate certificate = certificateRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("Certificate not found"));

        String pemContent = certificate.getPemFile();
        byte[] pemBytes = pemContent.getBytes(StandardCharsets.UTF_8);

        String fileName = "certificate-" + certificate.getSerialNumber() + ".pem";
        return new CertificateDownloadResponseDTO(pemBytes, fileName);
    }


    private CertificateType declareCertificateType(User.Role role) {

        return role.equals(User.Role.REGULAR_USER) ? CertificateType.END_ENTITY : CertificateType.INTERMEDIATE;
    }

    private void persistCertificate(String organization, KeyPair keyPair, X509Certificate cert, Certificate certificate) throws CertificateException, IOException, KeyStoreException, NoSuchAlgorithmException, InvalidAlgorithmParameterException, NoSuchPaddingException, IllegalBlockSizeException, BadPaddingException, InvalidKeyException {

        String keyStorePassword = keyStorePasswordGenerator.generatePassword(16);
        String pkPassword = keyStorePasswordGenerator.generatePassword(16);

        passwordStorage.storePrivateKeyPassword(organization, pkPassword, certificate.getSerialNumber());
        passwordStorage.storeKeyStorePassword(organization, keyStorePassword, certificate.getSerialNumber());

        keyStoreService.loadKeyStore(null, keyStorePassword.toCharArray());
        keyStoreService.write(certificate.getSerialNumber(), keyPair.getPrivate(), pkPassword.toCharArray(), cert);
        keyStoreService.saveKeyStore(certificate.getSerialNumber(), keyStorePassword.toCharArray());

        certificateRepository.save(certificate);

    }

    private BigInteger generateSerialNumber() {
        return BigInteger.valueOf(System.currentTimeMillis());
    }

    private PrivateKey loadParentPrivateKey(Certificate certificate) throws InvalidNameException {
        String issuersOrganization = certificate.getIssuer().getOrganization();
        String parentSerialNumber = certificate.getSerialNumber();
        String parentKeystorePassword = passwordStorage.loadKeyStorePassword(issuersOrganization, parentSerialNumber);
        String parentPrivateKeyPassword = passwordStorage.loadPrivateKeyPassword(issuersOrganization, parentSerialNumber);
        return keyStoreService.readPrivateKey(parentSerialNumber, parentKeystorePassword, parentSerialNumber, parentPrivateKeyPassword);

    }

    @Override
    public CertificateCaSignResponseDTO generateCaSignedCertificateExternal(UserDetailsImpl user, CaSignSubjectExternalDataDTO data, MultipartFile csr) throws NoSuchAlgorithmException, IOException, InvalidNameException, InvalidAlgorithmParameterException, NoSuchPaddingException, IllegalBlockSizeException, CertificateException, KeyStoreException, BadPaddingException, InvalidKeyException {
        CertificateType certificateType = declareCertificateType(user.getUserRole());
        Certificate caCertificate = certificateRepository.findById(data.caId()).orElseThrow(() -> new EntityNotFoundException("CA Not found"));
        String pemFile = new String(csr.getBytes());

        PKCS10CertificationRequest csrCertificate = null;
        boolean isValid = false;
        try (PEMParser pemParser = new PEMParser(new StringReader(new String(pemFile.getBytes())))) {
            csrCertificate = (PKCS10CertificationRequest) pemParser.readObject();

            isValid = csrCertificate.isSignatureValid(
                    new JcaContentVerifierProviderBuilder().setProvider("BC").build(csrCertificate.getSubjectPublicKeyInfo())
            );

        } catch (OperatorCreationException | PKCSException e) {
            throw new RuntimeException(e);
        }

        if (!isValid)
            throw new IllegalArgumentException("Corrupted or invalid certificate file");


        X500Name subjectName = csrCertificate.getSubject();
        Subject subject = new Subject(subjectName);
        BigInteger serialNumber = generateSerialNumber();

        LocalDate today = LocalDate.now();
        LocalDate withDays = today.plusDays(data.validityDays());
        if (withDays.isAfter(caCertificate.getValidTo()))
            throw new IllegalArgumentException("Certificate cannot last longer that its parent CA");


        PrivateKey parentPrivateKey = loadParentPrivateKey(caCertificate);

        X509Certificate cert = generator.generateCertificate(subject, parentPrivateKey, caCertificate, today, withDays, serialNumber.toString());

        String pemFileCert = pemConverter.convertToPEM(cert);

        User subjectUser = userRepository.findById(data.subjectId()).orElseThrow(EntityNotFoundException::new);

        SubjectPublicKeyInfo pkInfo = csrCertificate.getSubjectPublicKeyInfo();
        JcaPEMKeyConverter converter = new JcaPEMKeyConverter().setProvider("BC");

        Certificate certificate = certificateFactory.createCertificate(
                certificateType,
                cert.getSerialNumber().toString(),
                pemFileCert,
                today,
                withDays,
                caCertificate,
                caCertificate.getIssuer()
                , subject,
                subjectUser);

        persistCertificateExternal(subjectUser.getOrganization(), cert, certificate);
        return new CertificateCaSignResponseDTO(certificate.getId());
    }

    private void persistCertificateExternal(String organization, X509Certificate cert, Certificate certificate) throws CertificateException, IOException, KeyStoreException, NoSuchAlgorithmException, InvalidAlgorithmParameterException, NoSuchPaddingException, IllegalBlockSizeException, BadPaddingException, InvalidKeyException {

        String keyStorePassword = keyStorePasswordGenerator.generatePassword(16);

        passwordStorage.storeKeyStorePassword(organization, keyStorePassword, certificate.getSerialNumber());
        keyStoreService.loadKeyStore(null, keyStorePassword.toCharArray());
        keyStoreService.write(certificate.getSerialNumber(), cert);
        keyStoreService.saveKeyStore(certificate.getSerialNumber(), keyStorePassword.toCharArray());

        certificateRepository.save(certificate);

    }
//    private void persistCertificate(String organization, KeyPair keyPair, X509Certificate cert, Certificate certificate) throws CertificateException, IOException, KeyStoreException, NoSuchAlgorithmException, InvalidAlgorithmParameterException, NoSuchPaddingException, IllegalBlockSizeException, BadPaddingException, InvalidKeyException {
//
//        String keyStorePassword = keyStorePasswordGenerator.generatePassword(16);
//        String pkPassword = keyStorePasswordGenerator.generatePassword(16);
//
//        passwordStorage.storePrivateKeyPassword(organization, pkPassword, certificate.getSerialNumber());
//        passwordStorage.storeKeyStorePassword(organization, keyStorePassword, certificate.getSerialNumber());
//
//        keyStoreService.loadKeyStore(null, keyStorePassword.toCharArray());
//        keyStoreService.write(certificate.getSerialNumber(), keyPair.getPrivate(), pkPassword.toCharArray(), cert);
//        keyStoreService.saveKeyStore(certificate.getSerialNumber(), keyStorePassword.toCharArray());
//
//        certificateRepository.save(certificate);
//
//    }
}
