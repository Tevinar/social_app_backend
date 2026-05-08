import { HttpStatus, Injectable } from '@nestjs/common';
import { InvalidRefreshTokenError } from '../../../features/auth/application/use-cases/refresh-session.use-case';
import {
  InvalidCredentialsError,
  UserAlreadySignedInOnDeviceError,
} from '../../../features/auth/application/use-cases/sign-in-with-email-password.use-case';
import { EmailAlreadyInUseError } from '../../../features/auth/application/use-cases/sign-up-with-email-password.use-case';
import { InvalidAccessTokenError } from '../../../features/auth/application/use-cases/validate-access-token.use-case';
import { InvalidDeviceIdError } from '../../../features/auth/domain/value-objects/device-id';
import { InvalidEmailError } from '../../../features/auth/domain/value-objects/email';
import { InvalidNameError } from '../../../features/auth/domain/value-objects/name';
import { InvalidNewPasswordError } from '../../../features/auth/domain/value-objects/new-password';
import { InvalidChatCandidateCursorError } from '../../../features/chat/application/pagination/chat-candidate.cursor';
import { InvalidChatListCursorError } from '../../../features/chat/application/pagination/chat-list.cursor';
import { InvalidChatMessageCursorError } from '../../../features/chat/application/pagination/chat-message-list.cursor';
import { ChatMemberNotFoundError } from '../../../features/chat/application/use-cases/create-chat.use-case';
import { ChatNotFoundError } from '../../../features/chat/application/use-cases/create-chat-message.use-case';
import {
  InvalidChatMemberIdError,
  InvalidChatMembersError,
} from '../../../features/chat/domain/value-objects/chat-members';
import { InvalidChatMessageContentError } from '../../../features/chat/domain/value-objects/chat-message-content';

/**
 * Maps thrown errors to a transport-neutral public error description.
 */
@Injectable()
export class ErrorToExceptionMapper {
  /**
   * Converts an unknown thrown value into the public error contract used by
   * transport-specific exception filters.
   *
   * @param error Error thrown from the request pipeline.
   * @returns Public error metadata for the active transport filter.
   */
  mapError(error: unknown): MappedException {
    if (error instanceof InvalidCredentialsError) {
      return {
        code: 'invalid_credentials',
        httpStatus: HttpStatus.UNAUTHORIZED,
        message: error.message,
        isExpected: true,
      };
    }

    if (error instanceof InvalidRefreshTokenError) {
      return {
        code: 'invalid_refresh_token',
        httpStatus: HttpStatus.UNAUTHORIZED,
        message: error.message,
        isExpected: true,
      };
    }

    if (error instanceof InvalidAccessTokenError) {
      return {
        code: 'invalid_access_token',
        httpStatus: HttpStatus.UNAUTHORIZED,
        message: error.message,
        isExpected: true,
      };
    }

    if (error instanceof EmailAlreadyInUseError) {
      return {
        code: 'email_already_in_use',
        httpStatus: HttpStatus.CONFLICT,
        message: error.message,
        isExpected: true,
      };
    }

    if (error instanceof UserAlreadySignedInOnDeviceError) {
      return {
        code: 'user_already_signed_in_on_device',
        httpStatus: HttpStatus.CONFLICT,
        message: error.message,
        isExpected: true,
      };
    }

    if (error instanceof InvalidEmailError) {
      return {
        code: 'invalid_email',
        httpStatus: HttpStatus.BAD_REQUEST,
        message: error.message,
        isExpected: true,
      };
    }

    if (error instanceof InvalidDeviceIdError) {
      return {
        code: 'invalid_device_id',
        httpStatus: HttpStatus.BAD_REQUEST,
        message: error.message,
        isExpected: true,
      };
    }

    if (error instanceof InvalidNameError) {
      return {
        code: 'invalid_name',
        httpStatus: HttpStatus.BAD_REQUEST,
        message: error.message,
        isExpected: true,
      };
    }

    if (error instanceof InvalidNewPasswordError) {
      return {
        code: 'invalid_new_password',
        httpStatus: HttpStatus.BAD_REQUEST,
        message: error.message,
        isExpected: true,
      };
    }

    if (error instanceof InvalidChatMemberIdError) {
      return {
        code: 'invalid_chat_member_id',
        httpStatus: HttpStatus.BAD_REQUEST,
        message: error.message,
        isExpected: true,
      };
    }

    if (error instanceof InvalidChatMembersError) {
      return {
        code: 'invalid_chat_members',
        httpStatus: HttpStatus.BAD_REQUEST,
        message: error.message,
        isExpected: true,
      };
    }

    if (error instanceof InvalidChatMessageContentError) {
      return {
        code: 'invalid_chat_message_content',
        httpStatus: HttpStatus.BAD_REQUEST,
        message: error.message,
        isExpected: true,
      };
    }

    if (error instanceof InvalidChatCandidateCursorError) {
      return {
        code: 'invalid_chat_candidate_cursor',
        httpStatus: HttpStatus.BAD_REQUEST,
        message: error.message,
        isExpected: true,
      };
    }

    if (error instanceof InvalidChatListCursorError) {
      return {
        code: 'invalid_chat_list_cursor',
        httpStatus: HttpStatus.BAD_REQUEST,
        message: error.message,
        isExpected: true,
      };
    }

    if (error instanceof InvalidChatMessageCursorError) {
      return {
        code: 'invalid_chat_message_cursor',
        httpStatus: HttpStatus.BAD_REQUEST,
        message: error.message,
        isExpected: true,
      };
    }

    if (error instanceof ChatMemberNotFoundError) {
      return {
        code: 'chat_member_not_found',
        httpStatus: HttpStatus.NOT_FOUND,
        message: error.message,
        isExpected: true,
      };
    }

    if (error instanceof ChatNotFoundError) {
      return {
        code: 'chat_not_found',
        httpStatus: HttpStatus.NOT_FOUND,
        message: error.message,
        isExpected: true,
      };
    }

    return {
      code: 'internal_server_error',
      httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      isExpected: false,
    };
  }
}

/**
 * Error metadata shared by transport-specific exception filters.
 */
export type MappedException = {
  code: string;
  httpStatus: HttpStatus;
  message: string;
  isExpected: boolean;
};
