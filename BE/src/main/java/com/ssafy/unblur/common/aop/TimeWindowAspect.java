package com.ssafy.unblur.common.aop;

import com.ssafy.unblur.common.annotation.TimeWindow;
import com.ssafy.unblur.common.exception.BaseException;
import com.ssafy.unblur.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.LocalTime;

/**
 * TimeWindow 어노테이션을 처리하는 AOP.
 */
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class TimeWindowAspect {

    private final Clock clock;

    @Around("@annotation(timeWindow)")
    public Object enforceTimeWindow(ProceedingJoinPoint joinPoint, TimeWindow timeWindow) throws Throwable {
        LocalTime now = LocalTime.now(clock);
        LocalTime start = LocalTime.parse(timeWindow.start());
        LocalTime end = LocalTime.parse(timeWindow.end());

        boolean allowed = isWithinWindow(now, start, end);

        if (!allowed) {
            throw new BaseException(ErrorCode.ACCESS_DENIED);
        }

        return joinPoint.proceed();
    }

    private boolean isWithinWindow(LocalTime now, LocalTime start, LocalTime end) {
        if (start.equals(end)) {
            return true;
        }

        if (start.isBefore(end)) {
            return !now.isBefore(start) && now.isBefore(end);
        }

        // 자정 넘김 구간 (예: 20:00 ~ 02:00)
        return !now.isBefore(start) || now.isBefore(end);
    }
}
