package com.team20.pki.caUsers.dto;

import java.util.UUID;

public record CAUserGetResponse(UUID id,
                                String firstName,
                                String lastName,
                                String email,
                                String organization) {

}
