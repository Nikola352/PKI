package com.team20.pki.common.exception.handler;

import com.team20.pki.common.dto.ErrorResponseDto;
import com.team20.pki.common.exception.InvalidRequestError;
import com.team20.pki.common.exception.NotFoundError;
import com.team20.pki.common.exception.ServerError;
import com.team20.pki.common.exception.UnauthorizedError;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.Collections;

@Slf4j
@ControllerAdvice
public class CustomExceptionHandler {
    @ExceptionHandler(NotFoundError.class)
    public ResponseEntity<ErrorResponseDto> handleNotFoundError(NotFoundError error) {
        log.warn("NotFoundError: {}", error.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                new ErrorResponseDto(HttpStatus.NOT_FOUND.value(), error.getMessage())
        );
    }

    @ExceptionHandler(InvalidRequestError.class)
    public ResponseEntity<ErrorResponseDto> handleInvalidRequestError(InvalidRequestError error) {
        log.warn("InvalidRequestError: {}", error.getMessage());
        return ResponseEntity.badRequest().body(new ErrorResponseDto(
                HttpStatus.BAD_REQUEST.value(),
                error.getMessage(),
                error.getErrors() != null ? error.getErrors() : Collections.emptyMap()
        ));
    }

    @ExceptionHandler(UnauthorizedError.class)
    public ResponseEntity<ErrorResponseDto> handleAccessDeniedException(RuntimeException exception) {
        log.warn("AccessDenied: {}", exception.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                new ErrorResponseDto(HttpStatus.FORBIDDEN.value(), exception.getMessage())
        );
    }

    @ExceptionHandler(ServerError.class)
    public ResponseEntity<ErrorResponseDto> handleServerError(ServerError error) {
        int statusCode = (error.getCode() != null && error.getCode() >= 100 && error.getCode() <= 599)
                ? error.getCode() : HttpStatus.INTERNAL_SERVER_ERROR.value();
        log.error("ServerError: {}", error.getMessage());
        return ResponseEntity.status(statusCode).body(
                new ErrorResponseDto(statusCode, error.getMessage())
        );
    }
}
