package com.team20.pki.authentication.mapper;

import com.team20.pki.authentication.dto.VerificationCheckResponseDto;
import com.team20.pki.authentication.model.RegisterRequest;
import com.team20.pki.common.model.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface RegisterRequestMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "role", defaultValue = "REGULAR_USER")
    User toUser(RegisterRequest request);

    VerificationCheckResponseDto toCheckDto(RegisterRequest request);
}
