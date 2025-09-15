package com.team20.pki.encryption.mapper;

import com.team20.pki.encryption.model.OrganizationKey;
import com.team20.pki.encryption.model.WrappedKey;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface OrganizationKeyMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "organizationName", source = "organization")
    @Mapping(target = "wrappedKey", source = "wrappedKey")
    OrganizationKey toOrganizationKey(String organization, WrappedKey wrappedKey);
}
