// 회원가입 시 설문조사 질문들
export const SURVEY_QUESTIONS = {
  // Step 1: 본인 정보
  smoking: {
    question: "[본인] 흡연 여부",
    options: [
      { value: "non-smoker-hate", label: "비흡연자 (담배 냄새도 싫어요)" },
      { value: "non-smoker-ok", label: "비흡연자 (가끔 피우는 건 이해해요)" },
      { value: "vape", label: "전자담배 애용" },
      { value: "smoker", label: "연초 애용 (흡연자)" },
    ],
  },
  drinking: {
    question: "[본인] 음주 스타일",
    options: [
      { value: "none", label: "술을 아예 못 마셔요 (논알콜파)" },
      { value: "social", label: "분위기만 맞춰요 (맥주 1~2잔)" },
      { value: "moderate", label: "적당히 즐겨요 (주 1~2회)" },
      { value: "heavy", label: "술자리를 사랑해요 (애주가)" },
    ],
  },
  dealbreakers: {
    question: "[상대] 이것만은 절대 안 돼요 (기피 1순위)",
    multiple: true,
    options: [
      { value: "no-smoking", label: "흡연자 절대 사절" },
      { value: "no-drinking", label: "술 못 마시는 사람 (또는 술고래)" },
      { value: "no-religion", label: "특정 종교 강요" },
      { value: "no-tattoo", label: "문신이 과한 사람" },
      { value: "no-typo", label: "맞춤법 파괴자" },
      { value: "none", label: "없음 (다 괜찮아요)" },
    ],
  },
  
  // Step 2: 데이트 & 연애 스타일
  dateStyle: {
    question: "[데이트] 주말 데이트, 내가 선호하는 것은?",
    options: [
      { value: "home", label: "집순/집돌이: 집에서 넷플릭스 보며 배달 음식 먹고 뒹굴거리기" },
      { value: "active", label: "활동파: 핫플 도장 깨기, 드라이브, 전시회 등 밖으로 나가기" },
      { value: "self-improvement", label: "자기계발: 각자 카페에서 할 일 하거나, 같이 운동/취미 배우기" },
    ],
  },
  contactStyle: {
    question: "[연락] 연인 사이 이상적인 연락 빈도는?",
    options: [
      { value: "frequent", label: "실시간: '지금 뭐 해?' 일거수일투족 공유 (1시간 이상 잠수 금지)" },
      { value: "moderate", label: "적당히: 출퇴근, 밥 먹을 때 등 주요 시점에만 (나만의 시간 존중)" },
      { value: "call", label: "통화: 톡은 귀찮아, 자기 전에 통화로 길게 이야기하는 게 좋아" },
    ],
  },
  conflictStyle: {
    question: "[갈등] 싸웠을 때 나는?",
    options: [
      { value: "direct", label: "직면형: 찜찜한 건 못 참아. 그 자리에서 대화로 바로 푼다." },
      { value: "time", label: "숙고형: 감정이 가라앉을 때까지 생각할 시간을 갖는다." },
    ],
  },
  spending: {
    question: "[소비] 100만 원이 생기면 어디에 쓸까?",
    options: [
      { value: "experience", label: "경험: 여행, 호캉스, 뮤지컬 관람 등 추억 남기기" },
      { value: "item", label: "물건: 전자기기, 옷, 가방 등 남는 게 최고" },
      { value: "save", label: "미래: 주식, 저축 등 통장 잔고 늘리기" },
    ],
  },
  
  // Step 3: 상대방 선호
  priority: {
    question: "[우선순위] 내가 이성을 볼 때 가장 중요하게 보는 1가지는?",
    options: [
      { value: "appearance", label: "외모/스타일 (내 눈에 예쁘고 잘생겨야 함)" },
      { value: "personality", label: "성격/티키타카 (말이 잘 통하고 유머 코드가 맞아야 함)" },
      { value: "ability", label: "능력/경제력 (배울 점이 있고 미래가 안정적이어야 함)" },
      { value: "values", label: "가치관/취향 (취미나 삶을 대하는 태도가 비슷해야 함)" },
    ],
  },
  agePreference: {
    question: "[나이] 선호하는 상대의 나이대는?",
    multiple: true,
    options: [
      { value: "older", label: "연상 (+1~4살)" },
      { value: "same", label: "동갑" },
      { value: "younger", label: "연하 (-1~4살)" },
      { value: "any", label: "나이 차이 상관없음" },
    ],
  },
  distancePreference: {
    question: "[거리] 장거리 연애(롱디) 가능?",
    options: [
      { value: "no", label: "절대 불가 (동네나 근처 지역 선호)" },
      { value: "weekend", label: "주말에만 만난다면 타 지역도 OK" },
      { value: "yes", label: "사랑하면 국경도 넘음" },
    ],
  },
  
  // Step 4: 관심사
  interests: {
    question: "관심사 태그 (최대 5개 선택)",
    multiple: true,
    max: 5,
    options: [
      { value: "fitness", label: "헬스" },
      { value: "running", label: "러닝" },
      { value: "hiking", label: "등산" },
      { value: "golf", label: "골프" },
      { value: "climbing", label: "클라이밍" },
      { value: "movie", label: "영화" },
      { value: "exhibition", label: "전시회" },
      { value: "reading", label: "독서" },
      { value: "concert", label: "콘서트" },
      { value: "netflix", label: "넷플릭스" },
      { value: "food", label: "맛집 탐방" },
      { value: "cooking", label: "요리" },
      { value: "cafe", label: "카페 투어" },
      { value: "wine", label: "와인/위스키" },
      { value: "travel", label: "여행" },
      { value: "investment", label: "재테크" },
      { value: "pet", label: "반려동물" },
      { value: "drive", label: "드라이브" },
      { value: "game", label: "게임" },
      { value: "idol", label: "아이돌" },
    ],
  },
}

// 밸런스 게임 질문들
export const BALANCE_QUESTIONS = [
  // 1. 요즘 감성 밸런스
  {
    category: "요즘 감성",
    question: "카톡 프로필 사진",
    optionA: "안 바꿈",
    optionB: "자주 바꿈",
  },
  {
    category: "요즘 감성",
    question: "인스타그램",
    optionA: "안 올림",
    optionB: "스토리 매일 올림",
  },
  {
    category: "요즘 감성",
    question: "사진 보정",
    optionA: "과함",
    optionB: "거의 없음",
  },
  {
    category: "요즘 감성",
    question: "셀카",
    optionA: "안 찍음",
    optionB: "장인",
  },
  {
    category: "요즘 감성",
    question: "SNS",
    optionA: "눈팅만",
    optionB: "댓글 요정",
  },
  
  // 2. 스타일 & 패션
  {
    category: "스타일 & 패션",
    question: "패션 스타일",
    optionA: "무채톤 올블랙",
    optionB: "컬러 포인트 필수",
  },
  {
    category: "스타일 & 패션",
    question: "옷차림",
    optionA: "편한 게 최고",
    optionB: "불편해도 스타일",
  },
  {
    category: "스타일 & 패션",
    question: "꾸미기",
    optionA: "꾸안꾸",
    optionB: "꾸꾸꾸",
  },
  {
    category: "스타일 & 패션",
    question: "신발",
    optionA: "운동화만 신기",
    optionB: "상황별 신발",
  },
  {
    category: "스타일 & 패션",
    question: "가방",
    optionA: "하나 돌려쓰기",
    optionB: "코디별 가방",
  },
  
  // 3. 성격
  {
    category: "성격",
    question: "말하기",
    optionA: "생각 많고 말 적음",
    optionB: "생각 적고 말 많음",
  },
  {
    category: "성격",
    question: "행동 스타일",
    optionA: "눈치 빠른 편",
    optionB: "솔직한 편",
  },
  {
    category: "성격",
    question: "일처리",
    optionA: "완벽하려다 미룸",
    optionB: "대충이라도 바로 함",
  },
  {
    category: "성격",
    question: "에너지 충전",
    optionA: "혼자 있어야 충전",
    optionB: "사람 있어야 충전",
  },
  {
    category: "성격",
    question: "결정",
    optionA: "오래 고민",
    optionB: "빠르게",
  },
  
  // 4. 생활 습관
  {
    category: "생활 습관",
    question: "알람",
    optionA: "10개",
    optionB: "1개",
  },
  {
    category: "생활 습관",
    question: "업무 스타일",
    optionA: "미루다 몰아서",
    optionB: "조금씩 꾸준히",
  },
  {
    category: "생활 습관",
    question: "정리",
    optionA: "방은 더러운데 머릿속 정리됨",
    optionB: "방은 깨끗한데 머릿속 복잡",
  },
  {
    category: "생활 습관",
    question: "집에 오면",
    optionA: "바로 눕기",
    optionB: "할 일 다 하고 눕기",
  },
  {
    category: "생활 습관",
    question: "야식",
    optionA: "포기 못함",
    optionB: "안 먹음",
  },
  
  // 5. 음식 취향
  {
    category: "음식 취향",
    question: "메뉴 선택",
    optionA: "평생 같은 메뉴",
    optionB: "매번 새로운 메뉴",
  },
  {
    category: "음식 취향",
    question: "맛집",
    optionA: "줄 서기",
    optionB: "근처 아무 데나",
  },
  {
    category: "음식 취향",
    question: "식사 선호",
    optionA: "양 많고 평범",
    optionB: "양 적고 맛집",
  },
  {
    category: "음식 취향",
    question: "맛 선호",
    optionA: "단짠 러버",
    optionB: "담백파",
  },
  {
    category: "음식 취향",
    question: "디저트",
    optionA: "배불러도 디저트",
    optionB: "디저트는 배 따로",
  },
  
  // 6. 여행 & 여가
  {
    category: "여행 & 여가",
    question: "여행 스타일",
    optionA: "일정 빼곡",
    optionB: "발 닿는 대로",
  },
  {
    category: "여행 & 여가",
    question: "사진",
    optionA: "100장",
    optionB: "거의 안 찍음",
  },
  {
    category: "여행 & 여가",
    question: "여행 목적",
    optionA: "힐링 여행",
    optionB: "관광 풀코스",
  },
  {
    category: "여행 & 여가",
    question: "여행 인원",
    optionA: "혼자 여행",
    optionB: "여럿이 여행",
  },
  {
    category: "여행 & 여가",
    question: "여행 중요도",
    optionA: "숙소 중요",
    optionB: "밖에서 노는 게 중요",
  },
  
  // 7. 디지털 & 미디어
  {
    category: "디지털 & 미디어",
    question: "유튜브",
    optionA: "알고리즘 신뢰",
    optionB: "직접 검색",
  },
  {
    category: "디지털 & 미디어",
    question: "영상 시청",
    optionA: "배속 필수",
    optionB: "정속 시청",
  },
  {
    category: "디지털 & 미디어",
    question: "콘텐츠",
    optionA: "넷플릭스 정주행",
    optionB: "짧은 영상 무한 스크롤",
  },
  {
    category: "디지털 & 미디어",
    question: "댓글",
    optionA: "먼저 봄",
    optionB: "영상만 봄",
  },
  {
    category: "디지털 & 미디어",
    question: "음악",
    optionA: "플레이리스트 있음",
    optionB: "그때그때 검색",
  },
  
  // 8. 극단 밸런스
  {
    category: "극단 밸런스",
    question: "음악 선택",
    optionA: "평생 같은 노래",
    optionB: "평생 랜덤 노래",
  },
  {
    category: "극단 밸런스",
    question: "계절 옷",
    optionA: "여름에 패딩",
    optionB: "겨울에 반팔",
  },
  {
    category: "극단 밸런스",
    question: "사진",
    optionA: "찍힐 때마다 눈 감기",
    optionB: "항상 어색한 포즈",
  },
  {
    category: "극단 밸런스",
    question: "리액션",
    optionA: "웃음 참기 불가",
    optionB: "로봇",
  },
  {
    category: "극단 밸런스",
    question: "말하기 스타일",
    optionA: "말하다가 결론 없음",
    optionB: "결론만 말함",
  },
]
