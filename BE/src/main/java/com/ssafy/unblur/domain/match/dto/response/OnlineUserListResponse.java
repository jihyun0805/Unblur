package com.ssafy.unblur.domain.match.dto.response;

import lombok.Builder;

import java.util.List;

@Builder
public record OnlineUserListResponse(
        List<OnlineUserDto> onlineUsers
) {
}