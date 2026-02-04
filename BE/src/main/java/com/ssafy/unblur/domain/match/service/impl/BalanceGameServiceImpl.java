package com.ssafy.unblur.domain.match.service.impl;

import com.ssafy.unblur.common.exception.BaseException;
import com.ssafy.unblur.common.exception.ErrorCode;
import com.ssafy.unblur.common.service.EventSender;
import com.ssafy.unblur.common.service.event.WsEventType;
import com.ssafy.unblur.domain.match.service.BalanceGameService;
import com.ssafy.unblur.domain.rtc.dto.event.BalanceGameMessages;
import com.ssafy.unblur.domain.match.model.BalanceChoice;
import com.ssafy.unblur.domain.match.model.BalanceQuestion;
import com.ssafy.unblur.domain.rtc.service.RtcParticipantStore;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import jakarta.annotation.PreDestroy;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantLock;
import java.util.stream.Collectors;

/**
 * 밸런스 게임(WebSocket) 처리 서비스 구현체
 * <p>
 * 단일 인스턴스 환경에서 인메모리로 게임 상태를 관리한다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BalanceGameServiceImpl implements BalanceGameService {

    /**
     * 초대 및 선택 타임아웃(초)
     */
    private static final long INVITE_TIMEOUT_SECONDS = 10L;

    /**
     * 선택 타임아웃(초)
     */
    private static final long SELECTION_TIMEOUT_SECONDS = 10L;

    /**
     * RTC 참가자 저장소
     */
    private final RtcParticipantStore participantStore;

    /**
     * 이벤트 전송기
     */
    private final EventSender eventSender;

    /**
     * 세션별 밸런스 게임 상태
     */
    private final Map<UUID, BalanceGameSession> sessions = new ConcurrentHashMap<>();

    /**
     * 세션별 동시성 제어 락
     */
    private final Map<UUID, ReentrantLock> locks = new ConcurrentHashMap<>();

    /**
     * 시간 제한 처리를 위한 스케줄러
     */
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);

    /**
     * 기본 밸런스 질문 목록
     */
    private static final List<BalanceQuestion> QUESTIONS = List.of(
            new BalanceQuestion("Q1", "1. 요즘 감성 밸런스 (Z세대/밈 감성)", "카톡 프사 안 바꿈 vs 프사 자주 바꿈", "카톡 프사 안 바꿈", "프사 자주 바꿈"),
            new BalanceQuestion("Q2", "1. 요즘 감성 밸런스 (Z세대/밈 감성)", "인스타 안 올림 vs 스토리 매일 올림", "인스타 안 올림", "스토리 매일 올림"),
            new BalanceQuestion("Q3", "1. 요즘 감성 밸런스 (Z세대/밈 감성)", "사진 보정 과함 vs 보정 거의 없음", "사진 보정 과함", "보정 거의 없음"),
            new BalanceQuestion("Q4", "1. 요즘 감성 밸런스 (Z세대/밈 감성)", "셀카 안 찍음 vs 셀카 장인", "셀카 안 찍음", "셀카 장인"),
            new BalanceQuestion("Q5", "1. 요즘 감성 밸런스 (Z세대/밈 감성)", "SNS 눈팅만 vs 댓글 요정", "SNS 눈팅만", "댓글 요정"),
            new BalanceQuestion("Q6", "2. 스타일 & 패션 밸런스", "무채톤 올블랙 vs 컬러 포인트 필수", "무채톤 올블랙", "컬러 포인트 필수"),
            new BalanceQuestion("Q7", "2. 스타일 & 패션 밸런스", "편한 게 최고 vs 불편해도 스타일", "편한 게 최고", "불편해도 스타일"),
            new BalanceQuestion("Q8", "2. 스타일 & 패션 밸런스", "꾸안꾸 vs 꾸꾸꾸", "꾸안꾸", "꾸꾸꾸"),
            new BalanceQuestion("Q9", "2. 스타일 & 패션 밸런스", "운동화만 신기 vs 상황별 신발", "운동화만 신기", "상황별 신발"),
            new BalanceQuestion("Q10", "2. 스타일 & 패션 밸런스", "가방 하나 돌려쓰기 vs 코디별 가방", "가방 하나 돌려쓰기", "코디별 가방"),
            new BalanceQuestion("Q11", "3. 성격 드러나는 밸런스", "생각 많고 말 적음 vs 생각 적고 말 많음", "생각 많고 말 적음", "생각 적고 말 많음"),
            new BalanceQuestion("Q12", "3. 성격 드러나는 밸런스", "눈치 빠른 편 vs 솔직한 편", "눈치 빠른 편", "솔직한 편"),
            new BalanceQuestion("Q13", "3. 성격 드러나는 밸런스", "완벽하려다 미룸 vs 대충이라도 바로 함", "완벽하려다 미룸", "대충이라도 바로 함"),
            new BalanceQuestion("Q14", "3. 성격 드러나는 밸런스", "혼자 있어야 충전 vs 사람 있어야 충전", "혼자 있어야 충전", "사람 있어야 충전"),
            new BalanceQuestion("Q15", "3. 성격 드러나는 밸런스", "결정 오래 vs 결정 빠름", "결정 오래", "결정 빠름"),
            new BalanceQuestion("Q16", "4. 생활 습관 밸런스 (공감 폭발)", "알람 10개 vs 알람 1개", "알람 10개", "알람 1개"),
            new BalanceQuestion("Q17", "4. 생활 습관 밸런스 (공감 폭발)", "미루다 몰아서 vs 조금씩 꾸준히", "미루다 몰아서", "조금씩 꾸준히"),
            new BalanceQuestion("Q18", "4. 생활 습관 밸런스 (공감 폭발)", "방은 더러운데 머릿속 정리됨 vs 방은 깨끗한데 머릿속 복잡", "방은 더러운데 머릿속 정리됨", "방은 깨끗한데 머릿속 복잡"),
            new BalanceQuestion("Q19", "4. 생활 습관 밸런스 (공감 폭발)", "집 오면 바로 눕기 vs 집 오면 할 일 다 하고 눕기", "집 오면 바로 눕기", "집 오면 할 일 다 하고 눕기"),
            new BalanceQuestion("Q20", "4. 생활 습관 밸런스 (공감 폭발)", "야식 포기 못함 vs 야식 안 먹음", "야식 포기 못함", "야식 안 먹음"),
            new BalanceQuestion("Q21", "5. 음식 취향 밸런스 (무조건 터짐)", "평생 같은 메뉴 vs 매번 새로운 메뉴", "평생 같은 메뉴", "매번 새로운 메뉴"),
            new BalanceQuestion("Q22", "5. 음식 취향 밸런스 (무조건 터짐)", "맛집 줄 서기 vs 근처 아무 데나", "맛집 줄 서기", "근처 아무 데나"),
            new BalanceQuestion("Q23", "5. 음식 취향 밸런스 (무조건 터짐)", "양 많고 평범 vs 양 적고 맛집", "양 많고 평범", "양 적고 맛집"),
            new BalanceQuestion("Q24", "5. 음식 취향 밸런스 (무조건 터짐)", "단짠 러버 vs 담백파", "단짠 러버", "담백파"),
            new BalanceQuestion("Q25", "5. 음식 취향 밸런스 (무조건 터짐)", "배불러도 디저트 vs 디저트는 배 따로", "배불러도 디저트", "디저트는 배 따로"),
            new BalanceQuestion("Q26", "6. 여행 & 여가 밸런스", "여행 일정 빼곡 vs 발 닿는 대로", "여행 일정 빼곡", "발 닿는 대로"),
            new BalanceQuestion("Q27", "6. 여행 & 여가 밸런스", "사진 100장 vs 사진 거의 안 찍음", "사진 100장", "사진 거의 안 찍음"),
            new BalanceQuestion("Q28", "6. 여행 & 여가 밸런스", "힐링 여행 vs 관광 풀코스", "힐링 여행", "관광 풀코스"),
            new BalanceQuestion("Q29", "6. 여행 & 여가 밸런스", "혼자 여행 vs 여럿이 여행", "혼자 여행", "여럿이 여행"),
            new BalanceQuestion("Q30", "6. 여행 & 여가 밸런스", "숙소 중요 vs 밖에서 노는 게 중요", "숙소 중요", "밖에서 노는 게 중요"),
            new BalanceQuestion("Q31", "7. 디지털 & 미디어 밸런스", "유튜브 알고리즘 신뢰 vs 직접 검색", "유튜브 알고리즘 신뢰", "직접 검색"),
            new BalanceQuestion("Q32", "7. 디지털 & 미디어 밸런스", "영상 배속 필수 vs 정속 시청", "영상 배속 필수", "정속 시청"),
            new BalanceQuestion("Q33", "7. 디지털 & 미디어 밸런스", "넷플릭스 정주행 vs 짧은 영상 무한 스크롤", "넷플릭스 정주행", "짧은 영상 무한 스크롤"),
            new BalanceQuestion("Q34", "7. 디지털 & 미디어 밸런스", "댓글 먼저 봄 vs 영상만 봄", "댓글 먼저 봄", "영상만 봄"),
            new BalanceQuestion("Q35", "7. 디지털 & 미디어 밸런스", "플레이리스트 있음 vs 그때그때 검색", "플레이리스트 있음", "그때그때 검색"),
            new BalanceQuestion("Q36", "8. 극단 밸런스 (웃음 담당)", "평생 같은 노래 vs 평생 랜덤 노래", "평생 같은 노래", "평생 랜덤 노래"),
            new BalanceQuestion("Q37", "8. 극단 밸런스 (웃음 담당)", "여름에 패딩 vs 겨울에 반팔", "여름에 패딩", "겨울에 반팔"),
            new BalanceQuestion("Q38", "8. 극단 밸런스 (웃음 담당)", "사진 찍힐 때마다 눈 감기 vs 항상 어색한 포즈", "사진 찍힐 때마다 눈 감기", "항상 어색한 포즈"),
            new BalanceQuestion("Q39", "8. 극단 밸런스 (웃음 담당)", "웃음 참기 불가 vs 리액션 로봇", "웃음 참기 불가", "리액션 로봇"),
            new BalanceQuestion("Q40", "8. 극단 밸런스 (웃음 담당)", "말하다가 결론 없음 vs 결론만 말함", "말하다가 결론 없음", "결론만 말함")
    );

    @Override
    public void invite(UUID conferenceId, UUID fromUserId) {
        log.info("밸런스 게임 초대 요청. conferenceId={}, fromUserId={}", conferenceId, fromUserId);

        // 밸런스 게임 초대를 위한 변수 선언
        UUID targetUserId;
        BalanceGameSession newSession;

        // 세션별 락 획득
        ReentrantLock lock = locks.computeIfAbsent(conferenceId, id -> new ReentrantLock());
        lock.lock();
        try {
            // 현재 세션 참가자 조회 및 1:1 조건 검증
            List<UUID> participants = participantStore.getParticipantIds(conferenceId);
            validateParticipants(participants, fromUserId);
            log.debug("밸런스 게임 참가자 확인. conferenceId={}, participants={}", conferenceId, participants);

            // 이미 진행 중인 게임이 있으면 중복 초대 차단
            BalanceGameSession existing = sessions.get(conferenceId);
            if (existing != null) {
                log.warn("밸런스 게임 중복 초대 차단. conferenceId={}, fromUserId={}", conferenceId, fromUserId);
                throw new BaseException(ErrorCode.BALANCE_ALREADY_IN_PROGRESS);
            }

            // 초대 대상(나 이외의 참가자) 결정
            targetUserId = participants.stream()
                    .filter(id -> !id.equals(fromUserId))
                    .findFirst()
                    .orElseThrow(() -> new BaseException(ErrorCode.BALANCE_TARGET_NOT_FOUND));

            log.info("밸런스 게임 초대 대상 확정. conferenceId={}, fromUserId={}, targetUserId={}", conferenceId, fromUserId, targetUserId);

            // 세션 상태 저장 및 타임아웃 예약
            newSession = BalanceGameSession.invited(fromUserId, targetUserId);
            sessions.put(conferenceId, newSession);

            // 초대 타임아웃 예약: 10초 내 응답이 없으면 자동 거절 처리
            newSession.inviteTimeout = scheduleInviteTimeout(conferenceId);
            log.debug("밸런스 게임 초대 타임아웃 예약. conferenceId={}, timeoutSeconds={}", conferenceId, INVITE_TIMEOUT_SECONDS);

        } finally {
            lock.unlock();
        }

        // 상대방에게 초대 이벤트 발행
        BalanceGameMessages.Invite message = BalanceGameMessages.Invite.builder()
                .conferenceId(conferenceId.toString())
                .fromUserId(fromUserId.toString())
                .build();

        eventSender.publish(targetUserId, WsEventType.BALANCE_INVITE, message);
        log.info("밸런스 게임 초대 전송. conferenceId={}, fromUserId={}, targetUserId={}", conferenceId, fromUserId, targetUserId);
    }

    @Override
    public void respond(UUID conferenceId, UUID fromUserId, boolean accepted) {
        log.info("밸런스 게임 응답 처리. conferenceId={}, fromUserId={}, accepted={}", conferenceId, fromUserId, accepted);

        // 밸런스 게임 응답 처리를 위한 변수 선언
        BalanceGameSession session;
        BalanceQuestion question = null;

        // 세션별 락 획득
        ReentrantLock lock = locks.computeIfAbsent(conferenceId, id -> new ReentrantLock());
        lock.lock();
        try {
            // 초대 대기 상태인지 확인
            session = sessions.get(conferenceId);
            if (session == null || session.state != BalanceGameState.INVITED) {
                log.warn("밸런스 게임 초대 상태 아님. conferenceId={}, fromUserId={}", conferenceId, fromUserId);
                throw new BaseException(ErrorCode.BALANCE_INVITE_NOT_FOUND);
            }

            // 초대받은 사용자만 응답 가능
            if (!session.targetUserId.equals(fromUserId)) {
                log.warn("밸런스 게임 응답 권한 없음. conferenceId={}, fromUserId={}", conferenceId, fromUserId);
                throw new BaseException(ErrorCode.BALANCE_RESPONSE_NOT_ALLOWED);
            }

            if (!accepted) { // 거절하는 경우
                // 타임아웃 예약을 취소하고 세션 제거
                cancelInviteTimeout(session);
                sessions.remove(conferenceId);
                log.info("밸런스 게임 초대 거절 처리. conferenceId={}, fromUserId={}", conferenceId, fromUserId);

            } else { // 수락하는 경우
                // 질문을 선택하고 선택 타임아웃 예약
                question = randomQuestion();
                session.start(question);
                cancelInviteTimeout(session);
                session.selectionTimeout = scheduleSelectionTimeout(conferenceId);
                log.info("밸런스 게임 시작. conferenceId={}, fromUserId={}, questionId={}", conferenceId, fromUserId, question.id());
            }

        } finally {
            lock.unlock();
        }

        if (!accepted) { // 거절하는 경우
            // 밸런스 게임 거절 알림 생성
            BalanceGameMessages.Declined declined = BalanceGameMessages.Declined.builder()
                    .conferenceId(conferenceId.toString())
                    .fromUserId(fromUserId.toString())
                    .build();

            // 거절 알림 전송
            eventSender.publish(session.inviterUserId, WsEventType.BALANCE_DECLINED, declined);
            log.info("밸런스 게임 거절 전송. conferenceId={}, inviterUserId={}, fromUserId={}", conferenceId, session.inviterUserId, fromUserId);
            return;
        }

        // 밸런스 게임 시작 알림 생성
        BalanceGameMessages.Start start = BalanceGameMessages.Start.builder()
                .conferenceId(conferenceId.toString())
                .questionId(question.id())
                .category(question.category())
                .question(question.question())
                .optionA(question.optionA())
                .optionB(question.optionB())
                .build();

        // 게임 시작 알림 전송
        eventSender.publish(session.inviterUserId, WsEventType.BALANCE_STARTED, start);
        eventSender.publish(session.targetUserId, WsEventType.BALANCE_STARTED, start);
        log.info("밸런스 게임 시작 전송. conferenceId={}, inviterUserId={}, targetUserId={}, questionId={}", conferenceId, session.inviterUserId, session.targetUserId, question.id());
    }

    @Override
    public void select(UUID conferenceId, UUID userId, String choiceRaw) {
        log.info("밸런스 게임 선택 처리. conferenceId={}, userId={}, choice={}", conferenceId, userId, choiceRaw);

        // 밸런스 게임 선택 처리를 위한 변수 선언
        ReentrantLock lock = locks.computeIfAbsent(conferenceId, id -> new ReentrantLock());
        BalanceGameSession session;
        BalanceChoice choice;
        try {
            choice = BalanceChoice.from(choiceRaw);

        } catch (IllegalArgumentException e) {
            log.warn("밸런스 게임 선택값 오류. conferenceId={}, userId={}, choice={}", conferenceId, userId, choiceRaw);
            throw new BaseException(ErrorCode.BALANCE_INVALID_CHOICE);
        }

        UUID otherUserId;
        boolean completed;
        BalanceQuestion question;
        List<BalanceGameMessages.Selection> selections = null;
        Boolean sameChoice = null;

        // 세션별 락 획득
        lock.lock();
        try {
            // 게임이 시작된 상태인지 확인
            session = sessions.get(conferenceId);
            if (session == null || session.state != BalanceGameState.STARTED) {
                log.warn("밸런스 게임 시작 상태 아님. conferenceId={}, userId={}", conferenceId, userId);
                throw new BaseException(ErrorCode.BALANCE_NOT_STARTED);
            }

            // 참여자 검증
            if (!session.isParticipant(userId)) {
                log.warn("밸런스 게임 참여자 아님. conferenceId={}, userId={}", conferenceId, userId);
                throw new BaseException(ErrorCode.BALANCE_NOT_PARTICIPANT);
            }

            // 중복 선택 방지
            if (session.selections.containsKey(userId)) {
                log.warn("밸런스 게임 중복 선택. conferenceId={}, userId={}", conferenceId, userId);
                throw new BaseException(ErrorCode.BALANCE_ALREADY_SELECTED);
            }

            // 선택 저장 후 상태 계산
            session.selections.put(userId, choice);
            otherUserId = session.otherUserId(userId);
            completed = session.selections.size() >= 2;
            question = session.question;
            log.debug("밸런스 게임 선택 저장. conferenceId={}, userId={}, completed={}, selectionCount={}", conferenceId, userId, completed, session.selections.size());

            if (completed) {
                // 양측 선택 완료: 결과 생성 후 타임아웃 취소 및 세션 제거
                selections = toSelections(session.selections);
                sameChoice = computeSameChoice(session.selections);
                cancelSelectionTimeout(session);
                sessions.remove(conferenceId);
                log.info("밸런스 게임 선택 완료. conferenceId={}, sameChoice={}", conferenceId, sameChoice);
            }

        } finally {
            lock.unlock();
        }

        // 선택 알림 생성
        BalanceGameMessages.PartnerSelected selected = BalanceGameMessages.PartnerSelected.builder()
                .conferenceId(conferenceId.toString())
                .userId(userId.toString())
                .build();

        // 상대방에게 선택 알림 전송
        eventSender.publish(otherUserId, WsEventType.BALANCE_SELECTED, selected);
        log.info("밸런스 게임 선택 알림 전송. conferenceId={}, fromUserId={}, toUserId={}", conferenceId, userId, otherUserId);

        // 한 명만 선택했다면 결과는 아직 전송하지 않음
        if (!completed) {
            return;
        }

        // 밸런스 게임 결과 생성
        BalanceGameMessages.Result result = BalanceGameMessages.Result.builder()
                .conferenceId(conferenceId.toString())
                .questionId(question.id())
                .category(question.category())
                .question(question.question())
                .optionA(question.optionA())
                .optionB(question.optionB())
                .sameChoice(sameChoice)
                .selections(selections)
                .build();

        // 양측에 결과 전송
        eventSender.publish(session.inviterUserId, WsEventType.BALANCE_RESULT, result);
        eventSender.publish(session.targetUserId, WsEventType.BALANCE_RESULT, result);
        log.info("밸런스 게임 결과 전송. conferenceId={}, inviterUserId={}, targetUserId={}", conferenceId, session.inviterUserId, session.targetUserId);
    }

    /**
     * 애플리케이션 종료 시 남아있는 스케줄 작업을 정리하는 메서드
     */
    @PreDestroy
    private void shutdownScheduler() {
        scheduler.shutdown();
        log.info("밸런스 게임 스케줄러 종료");
    }

    /**
     * 참가자 유효성을 검증하는 메서드
     *
     * @param participants 참가자 목록
     * @param userId       요청 사용자 ID
     * @throws BaseException 참여자가 아니거나 1:1 조건이 충족되지 않는 경우
     */
    private void validateParticipants(List<UUID> participants, UUID userId) {
        if (!participants.contains(userId)) {
            throw new BaseException(ErrorCode.BALANCE_NOT_PARTICIPANT);
        }

        if (participants.size() < 2) {
            throw new BaseException(ErrorCode.BALANCE_PARTNER_NOT_JOINED);
        }

        if (participants.size() > 2) {
            throw new BaseException(ErrorCode.BALANCE_ONLY_ONE_ON_ONE);
        }
    }

    /**
     * 질문을 랜덤으로 선택하는 메서드
     *
     * @return 선택된 질문
     */
    private BalanceQuestion randomQuestion() {
        int index = ThreadLocalRandom.current().nextInt(QUESTIONS.size());
        return QUESTIONS.get(index);
    }

    /**
     * 초대 응답 타임아웃을 예약하는 메서드
     * <p>
     * 실행 시점에 상태를 재확인하여 초대 상태(INVITED)가 아닐 경우 즉시 종료하고
     * 10초 내 응답이 없으면 세션 제거 및 초대자에게 거절 이벤트를 전송한다.
     *
     * @param conferenceId 세션 ID
     * @return 취소 가능한 스케줄 핸들
     */
    private ScheduledFuture<?> scheduleInviteTimeout(UUID conferenceId) {
        return scheduler.schedule(() -> {
            BalanceGameSession session;

            // 세션별 락 획득
            ReentrantLock lock = locks.computeIfAbsent(conferenceId, id -> new ReentrantLock());
            lock.lock();
            try {
                // 여전히 초대 대기 상태인지 확인
                session = sessions.get(conferenceId);
                if (session == null || session.state != BalanceGameState.INVITED) {
                    log.debug("초대 타임아웃 무시(상태 변경). conferenceId={}", conferenceId);
                    return;
                }

                // 타임아웃 처리: 세션 제거
                sessions.remove(conferenceId);

            } finally {
                lock.unlock();
            }

            // 응답 시간 초과: 초대자를 거절 처리로 알림
            BalanceGameMessages.Declined declined = BalanceGameMessages.Declined.builder()
                    .conferenceId(conferenceId.toString())
                    .fromUserId(session.targetUserId.toString())
                    .build();

            eventSender.publish(session.inviterUserId, WsEventType.BALANCE_DECLINED, declined);
            log.info("밸런스 게임 초대 타임아웃 처리. conferenceId={}, inviterUserId={}, targetUserId={}", conferenceId, session.inviterUserId, session.targetUserId);

        }, INVITE_TIMEOUT_SECONDS, TimeUnit.SECONDS);
    }

    /**
     * 선택 타임아웃을 예약하는 메서드
     * <p>
     * 실행 시점에 상태를 재확인하여 시작 상태(STARTED)가 아닐 경우 즉시 종료하고
     * 10초 내 선택이 없으면 미선택자를 NONE 처리한 뒤 결과를 전송한다.
     *
     * @param conferenceId 세션 ID
     * @return 취소 가능한 스케줄 핸들
     */
    private ScheduledFuture<?> scheduleSelectionTimeout(UUID conferenceId) {
        return scheduler.schedule(() -> {
            BalanceGameSession session;
            List<BalanceGameMessages.Selection> selections;
            Boolean sameChoice;
            BalanceQuestion question;

            // 세션별 락 획득
            ReentrantLock lock = locks.computeIfAbsent(conferenceId, id -> new ReentrantLock());
            lock.lock();
            try {
                // 여전히 게임 진행 중인지 확인
                session = sessions.get(conferenceId);
                if (session == null || session.state != BalanceGameState.STARTED) {
                    log.debug("선택 타임아웃 무시(상태 변경). conferenceId={}", conferenceId);
                    return;
                }

                // 2명 모두 선택했으면 타임아웃 무시
                if (session.selections.size() >= 2) {
                    log.debug("선택 타임아웃 무시(선택 완료). conferenceId={}", conferenceId);
                    return;
                }

                // 시간 초과 시 미선택자는 NONE 처리
                session.selections.putIfAbsent(session.inviterUserId, BalanceChoice.NONE);
                session.selections.putIfAbsent(session.targetUserId, BalanceChoice.NONE);

                // 결과 생성
                question = session.question;
                selections = toSelections(session.selections);
                sameChoice = computeSameChoice(session.selections);

                // 타임아웃 처리: 세션 제거
                sessions.remove(conferenceId);

            } finally {
                lock.unlock();
            }

            // 밸런스 게임 결과 생성
            BalanceGameMessages.Result result = BalanceGameMessages.Result.builder()
                    .conferenceId(conferenceId.toString())
                    .questionId(question.id())
                    .category(question.category())
                    .question(question.question())
                    .optionA(question.optionA())
                    .optionB(question.optionB())
                    .sameChoice(sameChoice)
                    .selections(selections)
                    .build();

            // 양측에 결과 전송
            eventSender.publish(session.inviterUserId, WsEventType.BALANCE_RESULT, result);
            eventSender.publish(session.targetUserId, WsEventType.BALANCE_RESULT, result);
            log.info("밸런스 게임 선택 타임아웃 결과 전송. conferenceId={}, inviterUserId={}, targetUserId={}", conferenceId, session.inviterUserId, session.targetUserId);

        }, SELECTION_TIMEOUT_SECONDS, TimeUnit.SECONDS);
    }

    /**
     * 선택 결과 맵을 전송용 DTO 목록으로 변환하는 메서드
     *
     * @param selections 사용자별 선택 결과
     * @return 전송용 선택 목록
     */
    private List<BalanceGameMessages.Selection> toSelections(Map<UUID, BalanceChoice> selections) {
        // 사용자별 선택 결과를 메시지 DTO로 변환
        return selections.entrySet().stream()
                .map(entry -> BalanceGameMessages.Selection.builder()
                        .userId(entry.getKey().toString())
                        .choice(entry.getValue().name())
                        .build()
                )
                .collect(Collectors.toList());
    }

    /**
     * 두 사용자의 선택이 동일한지 계산하는 메서드
     * <p>
     * NONE이 포함되면 동일 선택으로 보지 않는다.
     *
     * @param selections 사용자별 선택 결과
     * @return 동일 선택 여부
     */
    private boolean computeSameChoice(Map<UUID, BalanceChoice> selections) {
        // NONE 포함 시 동일 선택으로 보지 않음
        if (selections.containsValue(BalanceChoice.NONE)) {
            return false;
        }

        return selections.values().stream().distinct().count() == 1;
    }

    /**
     * 초대 타임아웃 스케줄을 취소하는 메서드
     *
     * @param session 세션 상태
     */
    private void cancelInviteTimeout(BalanceGameSession session) {
        // 초대 타임아웃 예약 취소
        ScheduledFuture<?> future = session.inviteTimeout;
        if (future != null && !future.isDone()) {
            future.cancel(false);
            log.debug("밸런스 게임 초대 타임아웃 취소. inviterUserId={}, targetUserId={}", session.inviterUserId, session.targetUserId);
        }

        session.inviteTimeout = null;
    }

    /**
     * 선택 타임아웃 스케줄을 취소하는 메서드
     *
     * @param session 세션 상태
     */
    private void cancelSelectionTimeout(BalanceGameSession session) {
        // 선택 타임아웃 예약 취소
        ScheduledFuture<?> future = session.selectionTimeout;
        if (future != null && !future.isDone()) {
            future.cancel(false);
            log.debug("밸런스 게임 선택 타임아웃 취소. inviterUserId={}, targetUserId={}", session.inviterUserId, session.targetUserId);
        }

        session.selectionTimeout = null;
    }

    /**
     * 밸런스 게임 진행 상태를 나타내는 열거형 클래스
     */
    private enum BalanceGameState {
        INVITED,
        STARTED
    }

    /**
     * 세션별 밸런스 게임 상태를 담는 내부 클래스
     * <p>
     * 초대/선택 타임아웃 핸들을 함께 보관하여 상태 변경 시 즉시 취소할 수 있도록 한다.
     * </p>
     */
    private static final class BalanceGameSession {
        /**
         * 초대한 사용자 ID
         */
        private final UUID inviterUserId;

        /**
         * 초대받은 사용자 ID
         */
        private final UUID targetUserId;

        /**
         * 현재 게임 상태
         */
        private BalanceGameState state;

        /**
         * 선택된 질문
         */
        private BalanceQuestion question;

        /**
         * 사용자별 선택 결과
         */
        private final Map<UUID, BalanceChoice> selections = new ConcurrentHashMap<>();

        /**
         * 초대 타임아웃 스케줄 핸들
         */
        private ScheduledFuture<?> inviteTimeout;

        /**
         * 선택 타임아웃 스케줄 핸들
         */
        private ScheduledFuture<?> selectionTimeout;

        /**
         * 초대 상태 세션을 생성하는 생성자
         *
         * @param inviterUserId 초대한 사용자
         * @param targetUserId  초대받은 사용자
         */
        private BalanceGameSession(UUID inviterUserId, UUID targetUserId) {
            this.inviterUserId = inviterUserId;
            this.targetUserId = targetUserId;
            this.state = BalanceGameState.INVITED;
        }

        /**
         * 초대 상태 세션 팩토리 메서드
         *
         * @param inviterUserId 초대한 사용자
         * @param targetUserId  초대받은 사용자
         * @return 세션 인스턴스
         */
        private static BalanceGameSession invited(UUID inviterUserId, UUID targetUserId) {
            return new BalanceGameSession(inviterUserId, targetUserId);
        }

        /**
         * 게임을 시작 상태로 전환하는 메서드
         *
         * @param question 선택된 질문
         */
        private void start(BalanceQuestion question) {
            this.question = question;
            this.state = BalanceGameState.STARTED;
            this.selections.clear();
        }

        /**
         * 참여자인지 확인하는 메서드
         *
         * @param userId 사용자 ID
         * @return 참여 여부
         */
        private boolean isParticipant(UUID userId) {
            return inviterUserId.equals(userId) || targetUserId.equals(userId);
        }

        /**
         * 상대방 사용자 ID를 조회하는 메서드
         *
         * @param userId 기준 사용자
         * @return 상대방 사용자 ID
         */
        private UUID otherUserId(UUID userId) {
            return inviterUserId.equals(userId) ? targetUserId : inviterUserId;
        }
    }
}
