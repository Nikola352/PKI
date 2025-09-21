package com.team20.pki.common.dto;

import lombok.AllArgsConstructor;
import lombok.Value;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@Value
@AllArgsConstructor
public class ErrorResponseDto {
    Integer code;
    String message;
    Map<String, String> errors;

    public ErrorResponseDto(Integer code, String message) {
        this.code = code;
        this.message = message;
        this.errors = new HashMap<>();
    }

    public Map<String, String> getErrors() {
        return Collections.unmodifiableMap(errors);
    }

    public void addError(String field, String message) {
        errors.put(field, message);
    }
}
