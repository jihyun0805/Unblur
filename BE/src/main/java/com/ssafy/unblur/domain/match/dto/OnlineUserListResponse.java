package com.ssafy.unblur.domain.match.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class OnlineUserListResponse {

    private List<OnlineUserDto> onlineUsers;
}
