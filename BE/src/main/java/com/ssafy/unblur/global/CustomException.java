package com.ssafy.unblur.global;

public class CustomException {

    public static class BaseException extends RuntimeException {
        public BaseException(String message) {
            super(message);
        }
    }

    public static class DuplicateNicknameException extends BaseException {
        public DuplicateNicknameException() {
            super("이미 사용중인 닉네임입니다.");
        }
    }

    public static class DuplicateEmailException extends BaseException {
        public DuplicateEmailException() {
            super("이미 사용중인 이메일입니다.");
        }
    }

    public static class BlankNicknameException extends BaseException {
        public BlankNicknameException() {
            super("닉네임을 입력해야 합니다.");
        }
    }

    public static class NicknameLengthException extends BaseException {
        public NicknameLengthException() {
            super("유효하지 않은 닉네임입니다.");
        }
    }
}
