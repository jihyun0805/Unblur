package com.ssafy.unblur.domain.user.dto;

import com.ssafy.unblur.domain.auth.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
@Builder
@AllArgsConstructor
public class UserProfileResponseDto {
    private UUID id;
    private String email;
    private String nickname;
    private Integer age; // birthDate를 기반으로 계산된 값
    private String birthDate;
    private String gender;
    private String region;
    private String mbti;
    private String bio; // User 엔티티의 intro와 매핑
    private Object surveyData; // User 엔티티의 detailedInfo와 매핑
    private String[] interestTags;
    private Integer clarityScore;

    public static UserProfileResponseDto from(User user) {
        return UserProfileResponseDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .age(user.getAge())
                .birthDate(user.getBirthDate().toString())
                .gender(user.getGender().name())
                .region(user.getRegion() != null ? user.getRegion().name() : null)
                .mbti(user.getMbti() != null ? user.getMbti().name() : null)
                .bio(user.getIntro())
                .surveyData(user.getDetailedInfo())
                .interestTags(user.getInterestTags())
                .clarityScore(user.getClarityScore())
                .build();
    }
}
