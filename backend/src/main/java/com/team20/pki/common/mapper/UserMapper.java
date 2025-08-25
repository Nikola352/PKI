package com.team20.pki.common.mapper;

import com.team20.pki.authentication.model.RegisterRequest;
import com.team20.pki.common.model.User;
import org.mapstruct.AfterMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface UserMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "role", ignore = true) // set after mapping
    User toUser(RegisterRequest request);

    @AfterMapping
    default void setDefaultRole(@SuppressWarnings("unused") RegisterRequest _req, @MappingTarget User user) {
        user.setRole(User.Role.REGULAR_USER);
    }
}
