// 회원가입 시 설문조사 질문들
export const SURVEY_QUESTIONS = {
  // Phase 1. 나의 분위기 (Vibe Check)
  dateStyle: {
    question: "Q1. 주말의 나는?",
    options: [
      { value: "homebody", label: "집순이/집돌이" },
      { value: "active", label: "밖돌이/활동파" },
      { value: "growth", label: "갓생러/성장파" },
    ],
  },
  contactStyle: {
    question: "Q2. 연락 스타일은?",
    options: [
      { value: "tikitaka", label: "티키타카" },
      { value: "myway", label: "마이웨이" },
      { value: "voice", label: "보이스파" },
    ],
  },
  conflictStyle: {
    question: "Q3. 싸웠을 때 나는?",
    options: [
      { value: "direct", label: "직면형" },
      { value: "thoughtful", label: "숙고형" },
    ],
  },
  spending: {
    question: "Q4. 100만 원이 생긴다면?",
    options: [
      { value: "memory", label: "추억 수집" },
      { value: "desire", label: "물욕 충족" },
      { value: "saver", label: "통장 요정" },
    ],
  },

  // Phase 2. 매칭 조건 (My Type)
  priority: {
    question: "Q5. 1순위로 보는 것?",
    options: [
      { value: "visual", label: "비주얼" },
      { value: "humor", label: "개그코드" },
      { value: "career", label: "본업존잘" },
      { value: "values", label: "가치관" },
    ],
  },
  agePreference: {
    question: "Q6. 선호 나이 (복수 선택)",
    multiple: true,
    options: [
      { value: "older", label: "연상" },
      { value: "same", label: "동갑" },
      { value: "younger", label: "연하" },
      { value: "any", label: "상관없음" },
    ],
  },
  distancePreference: {
    question: "Q7. 장거리(롱디) 가능 여부",
    options: [
      { value: "near", label: "근거리 선호" },
      { value: "weekend", label: "주말만 가능" },
      { value: "any", label: "거리 상관없음" },
    ],
  },

  // Phase 3. 현실 필터 (The Real Deal)
  smokingSelf: {
    question: "흡연을 하시나요?",
    options: [
      { value: "nonsmoker", label: "비흡연" },
      { value: "vape", label: "전자담배만" },
      { value: "smoker", label: "연초 포함(전부)" },
    ],
  },
  smokingPartner: {
    question: "상대방의 흡연 여부를 허용하시나요?",
    options: [
      { value: "any", label: "상관없음" },
      { value: "nonsmoker", label: "비흡연자만" },
      { value: "vape", label: "전담까진 OK" },
    ],
  },
  drinkingSelf: {
    question: "평소 음주 스타일이 어떠신가요?",
    options: [
      { value: "none", label: "금주/술을 못마심" },
      { value: "social", label: "가끔/사교적" },
      { value: "lover", label: "애주가" },
    ],
  },
  drinkingPartner: {
    question: "상대방의 음주 습관, 어디까지 괜찮으세요?",
    options: [
      { value: "any", label: "상관없음" },
      { value: "limit", label: "비음주·절주 선호" },
      { value: "buddy", label: "술친구 선호" },
    ],
  },
  religionSelf: {
    question: "종교를 믿으시나요?",
    options: [
      { value: "none", label: "무교" },
      { value: "christian", label: "기독교" },
      { value: "catholic", label: "천주교" },
      { value: "buddhist", label: "불교" },
      { value: "etc", label: "기타" },
    ],
  },
  religionPartner: {
    question: "상대방의 종교 여부를 허용하시나요?",
    options: [
      { value: "respect", label: "존중해요" },
      { value: "same", label: "같은 종교만" },
    ],
  },
  petSelf: {
    question: "반려동물을 키우시나요?",
    options: [
      { value: "none", label: "안 키움" },
      { value: "have", label: "키우고 있음" },
    ],
  },
  petPartner: {
    question: "상대방의 반려동물 키우기 여부를 허용하시나요?",
    options: [
      { value: "any", label: "상관없음" },
      { value: "prefer-none", label: "안 키우는 분 선호" },
    ],
  },

  // Phase 4. 관심사 태그 (Talk Topics)
  interests: {
    question: "관심사 태그",
    multiple: true,
    max: 5,
    options: [
      { value: "fitness", label: "헬스", category: "운동" },
      { value: "running", label: "러닝", category: "운동" },
      { value: "hiking", label: "등산", category: "운동" },
      { value: "golf", label: "골프", category: "운동" },
      { value: "climbing", label: "클라이밍", category: "운동" },
      { value: "baseball", label: "축구/야구", category: "운동" },

      { value: "movie", label: "영화/OTT", category: "문화" },
      { value: "exhibition", label: "전시", category: "문화" },
      { value: "reading", label: "독서", category: "문화" },
      { value: "concert", label: "콘서트", category: "문화" },
      { value: "game", label: "게임", category: "문화" },
      { value: "comic", label: "만화", category: "문화" },

      { value: "food", label: "맛집", category: "미식" },
      { value: "cooking", label: "요리", category: "미식" },
      { value: "cafe", label: "카페", category: "미식" },
      { value: "wine", label: "와인/술", category: "미식" },
      { value: "bread", label: "빵지순례", category: "미식" },

      { value: "travel", label: "여행", category: "라이프" },
      { value: "investment", label: "재테크", category: "라이프" },
      { value: "pet", label: "반려동물", category: "라이프" },
      { value: "drive", label: "드라이브", category: "라이프" },
      { value: "idol", label: "아이돌", category: "라이프" },
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
