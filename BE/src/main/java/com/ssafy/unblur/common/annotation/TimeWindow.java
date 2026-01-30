package com.ssafy.unblur.common.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * 특정 시간대에만 호출을 허용하는 메서드 어노테이션.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface TimeWindow {

    /**
     * 시작 시각 (HH:mm).
     */
    String start();

    /**
     * 종료 시각 (HH:mm).
     */
    String end();
}
