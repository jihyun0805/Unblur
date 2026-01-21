// 회원가입 시 설문조사 질문들
export const SURVEY_QUESTIONS = {
  // Phase 1. 나의 연애 DNA (About Me)
  dateStyle: {
    question: "Q1. 꿀 같은 주말, 연인과 함께라면?",
    options: [
      {
        value: "homebody",
        label: "🏠 집순이/집돌이 - 이불 밖은 위험해! 맛있는 거 시켜 먹고 넷플릭스 보며 힐링하고 싶어요.",
      },
      {
        value: "active",
        label: "🏃 에너지 뿜뿜 활동파 - 지루한 건 딱 질색! 핫플레이스, 드라이브, 전시회 등 밖으로 나가야 해요.",
      },
      {
        value: "growth",
        label: "📚 함께 성장하는 갓생파 - 각자 할 일을 하거나 운동, 취미를 배우며 알찬 시간을 보내고 싶어요.",
      },
    ],
  },
  contactStyle: {
    question: "Q2. 우리 사이 연락, 어느 정도가 좋을까요?",
    options: [
      {
        value: "realtime",
        label: "💬 실시간 티키타카 - 지금 뭐 해? 사소한 일상도 바로바로 공유하는 게 사랑이죠.",
      },
      {
        value: "balance",
        label: "🌿 적당한 밸런스 - 각자의 시간 존중! 주요 타이밍에만 연락해도 충분해요.",
      },
      {
        value: "call",
        label: "📞 톡보다는 목소리 - 텍스트는 감정이 안 느껴져요. 하루 끝에 통화로 길게 이야기하는 게 좋아요.",
      },
    ],
  },
  conflictStyle: {
    question: "Q3. 다툼이 생겼을 때, 당신의 대처법은?",
    options: [
      {
        value: "direct",
        label: "🔥 직면형 (Solve Now) - 찜찜한 상태는 못 참아요. 그 자리에서 대화로 풀고 화해해야 잠이 와요.",
      },
      {
        value: "cooldown",
        label: "🧘 숙고형 (Cool Down) - 감정이 앞서면 실수할 수 있어요. 혼자 생각할 시간을 갖고 진정되면 이야기해요.",
      },
    ],
  },
  spending: {
    question: "Q4. 뜻밖의 용돈 100만 원! 어디에 쓸까요?",
    options: [
      {
        value: "experience",
        label: "✨ 잊지 못할 추억 (경험) - 여행, 호캉스, 뮤지컬 관람 등 우리 마음에 남는 행복을 사겠어요.",
      },
      {
        value: "item",
        label: "🎁 남는 게 최고 (소유) - 평소 갖고 싶었던 전자기기, 가방, 옷 등 물건을 사는 게 실용적이죠.",
      },
      {
        value: "investment",
        label: "📈 든든한 미래 (투자) - 티끌 모아 태산! 주식이나 저축으로 통장 잔고를 늘릴래요.",
      },
    ],
  },

  // Phase 2. 내가 찾는 그 사람 (My Ideal Type)
  priority: {
    question: "Q5. 이성을 볼 때, '이것' 하나는 꼭 맞아야 해요! (1순위)",
    options: [
      { value: "appearance", label: "✨ 외모와 스타일 - 내 눈에 매력적인 게 최고" },
      { value: "personality", label: "💬 성격과 티키타카 - 개그 코드와 대화가 통해야 함" },
      { value: "ability", label: "💼 능력과 배울 점 - 존경할 수 있는 태도와 경제력" },
      { value: "values", label: "🧩 가치관과 취향 - 삶을 바라보는 방향이 비슷한 사람" },
    ],
  },
  agePreference: {
    question: "Q6. 선호하는 나이대는? (중복 선택 가능)",
    multiple: true,
    options: [
      { value: "older", label: "연상 (나보다 1~4살 많음)" },
      { value: "same", label: "동갑 (친구 같은 편안함)" },
      { value: "younger", label: "연하 (나보다 1~4살 어림)" },
      { value: "any", label: "상관없음 (나이는 숫자일 뿐)" },
    ],
  },
  distancePreference: {
    question: "Q7. 장거리 연애(롱디), 가능하신가요?",
    options: [
      {
        value: "no",
        label: "🙅 절대 불가 - 동네나 가까운 지역이 좋아요. 자주 보고 싶거든요.",
      },
      {
        value: "weekend",
        label: "🚆 주말엔 가능 - 평일엔 각자 열심히 살고, 주말에 타 지역 만남 OK!",
      },
      {
        value: "yes",
        label: "🌍 사랑하면 그만 - 거리가 무슨 상관인가요? 해외라도 마음만 맞으면 돼요.",
      },
    ],
  },

  // Phase 3. 우리의 연결고리 (Interest Tags)
  interests: {
    question: "대화가 잘 통하는 관심사를 5개 골라주세요!",
    multiple: true,
    max: 5,
    options: [
      { value: "fitness", label: "🏋 헬스", category: "운동 & 액티비티" },
      { value: "running", label: "🏃 러닝", category: "운동 & 액티비티" },
      { value: "hiking", label: "등산", category: "운동 & 액티비티" },
      { value: "golf", label: "골프", category: "운동 & 액티비티" },
      { value: "climbing", label: "🧗 클라이밍", category: "운동 & 액티비티" },

      { value: "movie", label: "🍿 영화/넷플릭스", category: "문화 & 예술" },
      { value: "exhibition", label: "🖼 전시회", category: "문화 & 예술" },
      { value: "reading", label: "📚 독서", category: "문화 & 예술" },
      { value: "concert", label: "🎤 콘서트", category: "문화 & 예술" },

      { value: "food", label: "맛집 탐방", category: "음식 & 미식" },
      { value: "cooking", label: "🍳 요리", category: "음식 & 미식" },
      { value: "cafe", label: "카페 투어", category: "음식 & 미식" },
      { value: "wine", label: "🍷 와인/위스키", category: "음식 & 미식" },

      { value: "travel", label: "여행", category: "라이프스타일" },
      { value: "investment", label: "💰 재테크", category: "라이프스타일" },
      { value: "pet", label: "🐶 반려동물", category: "라이프스타일" },
      { value: "drive", label: "🚗 드라이브", category: "라이프스타일" },
      { value: "game", label: "🎮 게임", category: "라이프스타일" },
      { value: "idol", label: "🎤 아이돌", category: "라이프스타일" },
    ],
  },
}

// 밸런스 질문 (미사용)
export const BALANCE_QUESTIONS: Array<{
  category: string
  question: string
  optionA: string
  optionB: string
}> = []
