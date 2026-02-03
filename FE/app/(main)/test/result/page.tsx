"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Share2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { UserProfileData, UserProfileModal } from "@/components/common/user-profile-modal"
import { getOnlineUsers, startOneOnOneMatch } from "@/lib/api/match"
import { getLoveDnaImage } from "@/lib/profile-image"

const getResultLabel = (type: string) => {
  if (!type || type.length !== 4) return ""
  return type.toUpperCase()
}

const getImagePath = (code: string) => `/test/results/${code}.PNG`
const formatSentences = (text: string) => text.replace(/(\.)\s*/g, "$1\n")
const getMatchTags = (code: string) => RESULT_CONTENT[code]?.tags || ""
const isValidCode = (code: string) => code && code.length === 4 && code !== "-"

const REGION_CODE_TO_LABEL: Record<string, string> = {
  SEOUL: "서울",
  GYEONGGI: "경기",
  INCHEON: "인천",
  BUSAN: "부산",
  DAEGU: "대구",
  DAEJEON: "대전",
  GWANGJU: "광주",
  ULSAN: "울산",
  SEJONG: "세종",
  GANGWON: "강원",
  CHUNGBUK: "충북",
  CHUNGNAM: "충남",
  JEONBUK: "전북",
  JEONNAM: "전남",
  GYEONGBUK: "경북",
  GYEONGNAM: "경남",
  JEJU: "제주",
}

const mapRegionLabel = (value?: string | null) => {
  if (!value) return undefined
  return REGION_CODE_TO_LABEL[value] ?? value
}

const mapOnlineUserToProfile = (user: {
  id: string
  nickname: string
  age: number
  gender: string
  region: string
  mbti: string
  intro: string | null
  interestTags: string[]
  clarityScore: number
}, loveDna?: string) => ({
  id: user.id,
  nickname: user.nickname,
  profile: {
    nickname: user.nickname,
    temperature: user.clarityScore,
    age: user.age,
    gender: user.gender === "MALE" ? "male" : user.gender === "FEMALE" ? "female" : undefined,
    region: mapRegionLabel(user.region),
    mbti: user.mbti,
    bio: user.intro ?? undefined,
    interests: user.interestTags,
    loveDna,
  } satisfies UserProfileData,
})

const RESULT_CONTENT: Record<
  string,
  {
    title: string
    slogan: string
    tags: string
    image: string
    feature: string
    caution: string
    bestMatch: { code: string; name: string; reason: string }
    worstMatch: { code: string; name: string; reason: string }
  }
> = {
  EFPD: {
    title: "사랑꾼 기획자",
    slogan: "너를 위해 준비했어, 이 완벽한 하루!",
    tags: "#이벤트장인 #표현왕 #서프라이즈",
    image: "/test/results/EFPD.PNG",
    feature:
      "기념일과 데이트 코스를 완벽하게 설계하는 로맨티시스트. 상대방이 감동하는 리액션을 볼 때 최고의 행복을 느낍니다.",
    caution: "내가 준비한 만큼 반응이 없으면 '나만 사랑해?'라며 금세 토라질 수 있습니다.",
    bestMatch: {
      code: "IFPA",
      name: "묵묵한 수호자",
      reason: "당신의 넘치는 감정 표현을 이들은 바위처럼 묵묵히 받아줍니다. 당신은 이들에게서 '정서적 안정감'을 얻고, 상대는 당신을 통해 삶의 활력을 얻는 완벽한 상호 보완 관계입니다."
    },
    worstMatch: {
      code: "ITSA",
      name: "쿨한 현실주의자",
      reason: "나의 낭만적인 이벤트를 '돈 낭비'나 '비효율'로 취급해서 상처를 줍니다.",
    },
  },
  EFPA: {
    title: "다정한 헌신가",
    slogan: "밥은 먹었어? 아픈 데는 없고?",
    tags: "#엄마마음 #세심한케어 #행동파",
    image: "/test/results/EFPA.PNG",
    feature:
      "말보다는 따뜻한 밥 한 끼, 약 챙겨주기 등 행동으로 사랑을 퍼붓습니다. 연인의 일상을 세세하게 챙기며 안정감을 줍니다.",
    caution: "과한 배려는 간섭이 될 수 있습니다. 헌신을 당연하게 여기면 크게 상처받습니다.",
    bestMatch: {
      code: "ITSD",
      name: "시니컬한 관찰자",
      reason: "당신의 세심한 배려가, 혼자이기 좋아하는 상대에게 부담스럽지 않은 온기로 다가갑니다. 묵묵히 곁을 내어주는 상대에게서 당신은 보답받는 기분을 느낍니다."
    },
    worstMatch: {
      code: "ITPD",
      name: "철저한 설계자",
      reason: "나의 따뜻한 호의를 '비합리적'이라며 분석하려 들고, 정서적 교감보다 계획만 따져서 숨 막힙니다.",
    },
  },
  EFSD: {
    title: "분위기 메이커",
    slogan: "오늘 날씨 좋다! 지금 바로 바다 갈까?",
    tags: "#감성충만 #즉흥여행 #애교쟁이",
    image: "/test/results/EFSD.PNG",
    feature:
      "솔직한 감정 표현과 어디로 튈지 모르는 매력의 소유자. 계획 없는 즉흥 데이트에서 낭만을 찾습니다.",
    caution: "기분 파라 달래주기 어렵습니다. 토라졌을 땐 논리보다 무조건적인 공감이 필요합니다.",
    bestMatch: {
      code: "ITPA",
      name: "믿음직한 전문가",
      reason: "감정 기복이 있는 당신에게 이들의 한결같은 침착함은 '심리적 닻' 역할을 합니다. 당신이 저지른 일을 이들이 묵묵히 해결해주며, 그 과정에서 당신은 깊은 신뢰와 사랑을 느낍니다."
    },
    worstMatch: {
      code: "ETPA",
      name: "현실적인 행동파",
      reason: "나의 즉흥적인 제안을 거절하고, 매번 규칙과 약속을 들먹이며 숨 막히게 합니다.",
    },
  },
  EFSA: {
    title: "활동적인 사랑둥이",
    slogan: "같이 하자! 너랑 하면 뭐든 재밌잖아.",
    tags: "#함께해야제맛 #액티비티 #스킨십",
    image: "/test/results/EFSA.PNG",
    feature:
      "정적인 대화보다 맛집 탐방, 운동 등 '함께' 하는 체험을 선호합니다. 연인과 24시간 붙어있고 싶어 합니다.",
    caution: "혼자 있는 시간을 견디기 힘들어합니다. 연락이 안 되면 불안도가 급격히 올라갑니다.",
    bestMatch: {
      code: "ITPD",
      name: "철저한 설계자",
      reason: "당신의 뜨거운 에너지가 이들의 차가운 논리를 녹입니다. 이들이 세운 탄탄한 미래 계획 안에서 당신은 불안함 없이 마음껏 뛰어놀 수 있어 심리적으로 가장 편안한 상태가 됩니다."
    },
    worstMatch: {
      code: "ITSD",
      name: "시니컬한 관찰자",
      reason: "내가 함께하고 싶어 할 때마다 '혼자만의 시간'이 필요하다며 벽을 칩니다.",
    },
  },
  ETPD: {
    title: "직진하는 리더",
    slogan: "답답한 건 딱 질색, 내가 해결해 줄게.",
    tags: "#불도저 #팩트폭격 #리드하는연애",
    image: "/test/results/ETPD.PNG",
    feature:
      "호불호가 확실하고, 썸 탈 때도 헷갈리게 하지 않습니다. 데이트 주도권을 잡고 리드하며 문제를 시원시원하게 해결합니다.",
    caution: "감정 공감보다 해결책을 앞세워 서운함을 줄 수 있습니다. '결론이 뭐야?'는 금기어.",
    bestMatch: {
      code: "IFSA",
      name: "온화한 힐러",
      reason: "당신의 주도적인 성향을 이들은 기꺼이 따르며 편안함을 느낍니다. 충돌 없이 당신의 리더십을 지지해주는 이들과 함께할 때, 당신은 불필요한 감정 소모 없이 목표를 향해 나아갈 수 있습니다."
    },
    worstMatch: {
      code: "IFSD",
      name: "나만의 예술가",
      reason: "리드하려고 하면 고집을 부리거나, 갈등 상황에서 대화를 피하고 동굴로 숨어버려 화병이 나게 합니다.",
    },
  },
  ETPA: {
    title: "현실적인 행동파",
    slogan: "약속 시간은 1시 00분, 늦지 마.",
    tags: "#약속은칼 #책임감 #효율중시",
    image: "/test/results/ETPA.PNG",
    feature:
      "빈말을 싫어하고 시간 약속과 신뢰를 목숨처럼 여깁니다. 연인의 문제가 생기면 누구보다 먼저 발 벗고 나섭니다.",
    caution: "융통성이 부족할 수 있습니다. 계획이 틀어지거나 상대가 징징거린다고 느끼면 냉정해집니다.",
    bestMatch: {
      code: "IFSD",
      name: "나만의 예술가",
      reason: "서로 다른 세계를 가졌기에 오히려 부딪히지 않습니다. 당신은 현실의 울타리를 지켜주고, 상대는 그 안에서 당신이 보지 못하는 감성적인 세상을 보여주며 서로의 결핍을 채워줍니다."
    },
    worstMatch: {
      code: "EFSD",
      name: "분위기 메이커",
      reason: "시간 약속을 자주 어기고, 계획 없이 기분대로 행동하여 나의 인내심을 테스트합니다.",
    },
  },
  ETSD: {
    title: "유쾌한 팩트쟁이",
    slogan: "근데 그건 아니지 않아? 논리적으로 말이야.",
    tags: "#토론왕 #솔직함 #뒤끝없음",
    image: "/test/results/ETSD.PNG",
    feature:
      "연인과 티키타카가 잘 되는 것을 중요시합니다. 논쟁도 대화의 일부로 즐기며, 싸워도 뒤끝 없이 쿨하게 풉니다.",
    caution: "무심코 던진 팩트가 연인에게는 비수가 될 수 있습니다. '말이 너무 세다'는 평 주의.",
    bestMatch: {
      code: "ITSA",
      name: "쿨한 현실주의자",
      reason: "감정적인 징징거림 없이 팩트와 논리로 대화가 통하는 '뇌섹 커플'입니다. 쿨하게 문제만 딱 해결하는 서로의 방식에 편안함을 느낍니다."
    },
    worstMatch: {
      code: "IFSA",
      name: "온화한 힐러",
      reason: "장난으로 던진 팩트에도 쉽게 상처받고 꽁해 있어서, 대화하기가 조심스럽고 답답합니다.",
    },
  },
  ETSA: {
    title: "자유로운 해결사",
    slogan: "재밌겠다! 일단 해보고 생각하자.",
    tags: "#오지랖 #문제해결 #번개모임",
    image: "/test/results/ETSA.PNG",
    feature:
      "에너지가 넘치고 연인의 어려움을 직접 몸으로 해결해 줍니다. 틀에 박힌 데이트보다 그때그때 끌리는 활동을 즐깁니다.",
    caution: "산만할 수 있습니다. 데이트 중에도 다른 것에 관심을 보이거나 집중하지 못하는 모습을 보일 수 있습니다.",
    bestMatch: {
      code: "IFPD",
      name: "신중한 낭만파",
      reason: "생각만 하다가 기회를 놓치는 상대의 손을 잡고 이끌어주는 존재입니다. 당신의 행동력과 상대의 신중함이 만나 실수 없는 모험을 즐길 수 있습니다."
    },
    worstMatch: {
      code: "IFPA",
      name: "묵묵한 수호자",
      reason: "너무 반응이 없고 정적이어서, 함께 있으면 에너지가 빨리고 벽이랑 대화하는 기분이 듭니다.",
    },
  },
  IFPD: {
    title: "신중한 낭만파",
    slogan: "말하지 않아도, 네가 뭘 좋아하는지 다 알아.",
    tags: "#속깊은대화 #세심한배려 #짝사랑전문",
    image: "/test/results/IFPD.PNG",
    feature:
      "겉은 조용하지만 속은 낭만으로 가득합니다. 상대의 취향을 기억해 두었다가 조용히 챙겨주는 스타일입니다.",
    caution: "생각이 너무 많아 시작이 어렵습니다. 상대가 확신을 주지 않으면 혼자 정리해버릴 수 있습니다.",
    bestMatch: {
      code: "ETSA",
      name: "자유로운 해결사",
      reason: "나의 복잡한 고민을 단순하게 해결해주는 사이다 같은 존재입니다. 내가 주저할 때 나를 세상 밖으로 꺼내주는 그들의 에너지에 끌립니다."
    },
    worstMatch: {
      code: "ETSD",
      name: "유쾌한 팩트쟁이",
      reason: "나의 섬세한 감성을 이해해주기보다 '그래서 결론이 뭐야?'라며 논리로 분위기를 깨서 상처를 줍니다.",
    },
  },
  IFPA: {
    title: "묵묵한 수호자",
    slogan: "걱정 마, 내가 항상 여기 있을게.",
    tags: "#배려왕 #경청 #흔들리지않음",
    image: "/test/results/IFPA.PNG",
    feature:
      "연애에서 가장 안정적인 유형. 말수는 적지만 연인이 필요할 때 항상 그 자리를 지킵니다.",
    caution: "힘든 점을 내색하지 않아 속병이 듭니다. '괜찮아'라는 말이 진짜가 아닐 수 있습니다.",
    bestMatch: {
      code: "EFPD",
      name: "사랑꾼 기획자",
      reason: "당신이 표현하지 못하는 사랑을 상대방이 대신 마음껏 표현해줍니다. 상대의 밝은 에너지가 당신의 정적인 삶에 색채를 더해주며, 감정 해소의 창구가 되어줍니다."
    },
    worstMatch: {
      code: "ETSA",
      name: "자유로운 해결사",
      reason: "너무 에너지가 넘치고 여기저기 벌려놓은 일이 많아, 곁에 있으면 기가 빨리고 피곤해집니다.",
    },
  },
  IFSD: {
    title: "나만의 예술가",
    slogan: "나는 나, 너는 너. 서로의 세계를 존중해 줘.",
    tags: "#마이웨이 #취향존중 #감성코드",
    image: "/test/results/IFSD.PNG",
    feature:
      "독특한 취향과 자신만의 세계가 확고합니다. 간섭은 싫어하지만, 코드가 맞는 사람에겐 깊게 빠져듭니다.",
    caution: "회피형 성향이 나타날 수 있습니다. 갈등 상황이 오면 동굴로 들어가 버릴 수 있습니다.",
    bestMatch: {
      code: "ETPA",
      name: "현실적인 행동파",
      reason: "당신의 개인적인 영역을 침범하지 않으면서도, 현실적인 문제들을 대신 처리해줍니다. 당신이 예술적인 세계에 몰입할 수 있도록 든든한 현실의 보호막이 되어주는 존재입니다."
    },
    worstMatch: {
      code: "ETPD",
      name: "직진하는 리더",
      reason: "나의 개인적인 영역과 취향을 존중하지 않고, 본인의 방식대로 나를 통제하려 듭니다.",
    },
  },
  IFSA: {
    title: "온화한 힐러",
    slogan: "네가 좋으면 나도 좋아. 싸우지 말자.",
    tags: "#평화주의 #소확행 #갈등회피",
    image: "/test/results/IFSA.PNG",
    feature:
      "물 흐르듯 편안한 연애를 추구합니다. 싸우는 것을 극도로 싫어해 웬만하면 상대에게 맞춰줍니다.",
    caution: "뭐든 '좋아'라고만 해서 우유부단해 보입니다. 상대가 답답함을 느낄 수 있습니다.",
    bestMatch: {
      code: "ETPD",
      name: "직진하는 리더",
      reason: "결정을 어려워하는 당신에게 명쾌한 답을 내려줍니다. 당신의 부드러움이 상대의 강함을 중화시키고, 상대의 강단이 당신을 보호하는 이상적인 '외강내유' 조합입니다."
    },
    worstMatch: {
      code: "ETSD",
      name: "유쾌한 팩트쟁이",
      reason: "만날 때마다 논쟁을 즐기거나 공격적인 말투를 사용하여, 나의 평화로운 멘탈을 흔듭니다.",
    },
  },
  ITPD: {
    title: "철저한 설계자",
    slogan: "우리 관계의 성공 확률은 99.9%야.",
    tags: "#미래설계 #논리적 #표현서툼",
    image: "/test/results/ITPD.PNG",
    feature:
      "감정적 밀당보다 신뢰를 선호합니다. 연애 초기부터 결혼이나 미래까지 고려한 현실적인 설계를 합니다.",
    caution: "너무 계산적이라는 오해를 받습니다. '왜?'라는 질문은 따지는 게 아니라 궁금한 것입니다.",
    bestMatch: {
      code: "EFSA",
      name: "활동적인 사랑둥이",
      reason: "계산적이고 딱딱해질 수 있는 당신의 삶에 이들의 따뜻한 감성이 스며듭니다. 논리로는 설명되지 않는 '사랑의 즐거움'을 알려주며, 당신의 긴장을 무장해제 시킵니다."
    },
    worstMatch: {
      code: "EFPA",
      name: "다정한 헌신가",
      reason: "나의 독립성을 침해하는 과도한 관심과, 논리보다 감정에 호소하는 태도가 부담스럽습니다.",
    },
  },
  ITPA: {
    title: "믿음직한 전문가",
    slogan: "사랑해라는 말 대신, 고장 난 차를 고쳐줄게.",
    tags: "#장인정신 #빈말못함 #실용주의",
    image: "/test/results/ITPA.PNG",
    feature:
      "묵묵히 자신의 할 일을 하며 연인을 서포트합니다. 말로 사랑을 속삭이기보다 문제를 해결해 주는 사람입니다.",
    caution: "영혼 없는 리액션보다는 차라리 솔직한 침묵이 낫습니다. 공감 능력 부족 주의.",
    bestMatch: {
      code: "EFSD",
      name: "분위기 메이커",
      reason: "단조로울 수 있는 당신의 일상에 예측불허의 즐거움을 줍니다. 이들이 저지르는 작은 사고들을 당신이 해결해 줄 때, 상대는 진심으로 감동하며 당신의 유능함을 추앙합니다."
    },
    worstMatch: {
      code: "EFPD",
      name: "사랑꾼 기획자",
      reason: "나에게 끊임없이 감정 표현을 요구하고 확인받으려 해서, 관계가 숙제처럼 느껴지게 합니다.",
    },
  },
  ITSD: {
    title: "시니컬한 관찰자",
    slogan: "함께 있어도 혼자만의 시간은 필요해.",
    tags: "#개인시간 #지적호기심 #분석",
    image: "/test/results/ITSD.PNG",
    feature:
      "지적인 대화가 통하는 사람을 좋아합니다. 연애 중에도 독립적인 공간과 시간이 반드시 보장되어야 합니다.",
    caution: "연락 텀이 길어지면 상대방은 이별을 준비할지도 모릅니다. 무관심해 보이지 않도록 주의.",
    bestMatch: {
      code: "EFPA",
      name: "다정한 헌신가",
      reason: "당신의 독립성을 존중하면서도, 식사나 건강 같은 기본적 욕구를 따뜻하게 챙겨줍니다. 감정적으로 들이대지 않고 은은하게 곁을 지켜주는 배려 덕분에 심리적 압박감 없이 사랑을 느낍니다."
    },
    worstMatch: {
      code: "EFSA",
      name: "활동적인 사랑둥이",
      reason: "혼자 있고 싶은 순간에도 끊임없이 연락하고 붙어 있으려 해서 숨 쉴 틈을 주지 않습니다.",
    },
  },
  ITSA: {
    title: "쿨한 현실주의자",
    slogan: "복잡한 건 싫어. 깔끔하고 효율적으로 만나자.",
    tags: "#효율 #가성비 #뒤끝제로",
    image: "/test/results/ITSA.PNG",
    feature:
      "감정 소모가 큰 연애를 싫어합니다. 쿨하고 깔끔한 만남을 선호하며, 데이트도 효율적인 동선을 짭니다.",
    caution: "낭만이 없다는 평을 들을 수 있습니다. 상대가 정서적 교감을 원할 때 귀찮아하지 마세요.",
    bestMatch: {
      code: "ETSD",
      name: "유쾌한 팩트쟁이",
      reason: "빙빙 돌려 말하거나 감정 싸움하는 것을 싫어하는 당신에게, 시원시원하고 논리적인 이들은 최고의 파트너입니다."
    },
    worstMatch: {
      code: "EFPD",
      name: "사랑꾼 기획자",
      reason: "비효율적인 이벤트와 낭만을 강요하며, 나의 현실적인 조언을 서운해하여 피곤하게 만듭니다.",
    },
  },
  DEFAULT: {
    title: "나만의 유형",
    slogan: "",
    tags: "#연애가치관 #테스트",
    image: "",
    feature: "결과를 확인하려면 테스트를 완료해 주세요.",
    caution: "테스트 결과가 저장되지 않았습니다.",
    bestMatch: { code: "-", name: "-", reason: "-" },
    worstMatch: { code: "-", name: "-", reason: "-" },
  },
}

export default function MbtiResultPage() {
  const router = useRouter()
  const [shareStatus, setShareStatus] = useState<string>("")
  const [listOpen, setListOpen] = useState(false)
  const [listType, setListType] = useState<"best" | "worst" | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailType, setDetailType] = useState<"best" | "worst" | null>(null)
  const [selectedProfile, setSelectedProfile] = useState<UserProfileData | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  const [result, setResult] = useState("")
  const [bestProfiles, setBestProfiles] = useState<Array<{ id: string; nickname: string; profile: UserProfileData }>>([])
  const [worstProfiles, setWorstProfiles] = useState<Array<{ id: string; nickname: string; profile: UserProfileData }>>([])

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = localStorage.getItem("loveTestResult") || sessionStorage.getItem("loveTestResult")
    const type = stored || user?.loveDna || ""
    setResult(getResultLabel(type))
  }, [user?.loveDna])

  const resultContent = RESULT_CONTENT[result] || RESULT_CONTENT.DEFAULT
  const modalTitle = listType === "best" ? "온라인 목록" : "온라인 목록"
  const modalProfiles = listType === "best" ? bestProfiles : worstProfiles
  const listLoveDna =
    listType === "best"
      ? resultContent.bestMatch.code
      : listType === "worst"
        ? resultContent.worstMatch.code
        : undefined
  const detailCode =
    detailType === "best"
      ? resultContent.bestMatch.code
      : detailType === "worst"
        ? resultContent.worstMatch.code
        : "DEFAULT"
  const detailContent = RESULT_CONTENT[detailCode] || RESULT_CONTENT.DEFAULT
  const detailReason =
    detailType === "best"
      ? resultContent.bestMatch.reason || "궁합 이유 정보가 없습니다."
      : detailType === "worst"
        ? resultContent.worstMatch.reason
        : ""

  useEffect(() => {
    let cancelled = false

    const fetchRecommendations = async () => {
      const nextBest: Array<{ id: string; nickname: string; profile: UserProfileData }> = []
      const nextWorst: Array<{ id: string; nickname: string; profile: UserProfileData }> = []

      if (isValidCode(resultContent.bestMatch.code)) {
        try {
          const response = await getOnlineUsers(5, resultContent.bestMatch.code)
          if (!cancelled) {
            response.onlineUsers.forEach((user) =>
              nextBest.push(mapOnlineUserToProfile(user, resultContent.bestMatch.code))
            )
          }
        } catch (error) {
          console.error("[TestResult] Failed to load best match users", error)
        }
      }

      if (isValidCode(resultContent.worstMatch.code)) {
        try {
          const response = await getOnlineUsers(5, resultContent.worstMatch.code)
          if (!cancelled) {
            response.onlineUsers.forEach((user) =>
              nextWorst.push(mapOnlineUserToProfile(user, resultContent.worstMatch.code))
            )
          }
        } catch (error) {
          console.error("[TestResult] Failed to load other match users", error)
        }
      }

      if (!cancelled) {
        if (
          isValidCode(resultContent.bestMatch.code) &&
          isValidCode(resultContent.worstMatch.code) &&
          resultContent.bestMatch.code !== resultContent.worstMatch.code
        ) {
          const bestIds = new Set(nextBest.map((user) => user.id))
          setBestProfiles(nextBest)
          setWorstProfiles(nextWorst.filter((user) => !bestIds.has(user.id)))
        } else {
          setBestProfiles(nextBest)
          setWorstProfiles(nextWorst)
        }
      }
    }

    fetchRecommendations()
    return () => {
      cancelled = true
    }
  }, [resultContent.bestMatch.code, resultContent.worstMatch.code])

  const handleRequestChat = async (targetUserId: string, nickname: string) => {
    try {
      await startOneOnOneMatch(targetUserId)
      toast({
        title: "1:1 매칭 요청",
        description: `${nickname}님에게 매칭 요청을 보냈습니다.`,
      })
    } catch (error) {
      console.error("[TestResult] 1:1 매칭 요청 실패", error)
      toast({
        title: "매칭 요청 실패",
        description: "잠시 후 다시 시도해 주세요.",
        variant: "destructive",
      })
    }
  }

  const handleOpenList = (type: "best" | "worst") => {
    setListType(type)
    setListOpen(true)
  }

  const handleOpenDetail = (type: "best" | "worst") => {
    setDetailType(type)
    setDetailOpen(true)
  }

  return (
    <div className="min-h-screen relative flex justify-center items-start w-full">
      <div className="fixed inset-0 bg-background/50 backdrop-blur-sm z-0" />

      <div className="relative z-10 container max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/home")} className="bg-card/50 backdrop-blur">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border bg-card/90 backdrop-blur shadow-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-16" />
              <CardTitle className="text-xl">나의 유형은?</CardTitle>
            </div>
            <div className="flex flex-col items-center text-center gap-1">
              {result ? (
                <>
                  {resultContent.image ? (
                    <img
                          src={resultContent.image}
                          alt={`${result} 결과 이미지`}
                          className="w-64 h-64 object-contain rounded-xl bg-card -mb-1"
                        />
                      ) : (
                        <div className="w-64 h-64 rounded-xl bg-muted flex items-center justify-center text-sm text-muted-foreground">
                          결과 이미지
                        </div>
                      )}
                      <div className="space-y-0.5">
                        <div className="text-lg font-semibold">{resultContent.title}</div>
                        {resultContent.slogan && (
                          <div className="text-sm text-muted-foreground">“{resultContent.slogan}”</div>
                        )}
                        <div className="text-xs text-muted-foreground">{resultContent.tags}</div>
                      </div>
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">결과 정보를 찾을 수 없습니다.</div>
                  )}
            </div>
            <div className="rounded-xl border bg-card/50 px-4 py-4 text-center space-y-4">
              <div>
                <div className="font-semibold mb-3">특징</div>
                <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {formatSentences(resultContent.feature)}
                </div>
              </div>
              <div>
                <div className="font-semibold mb-3">주의점</div>
                <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {formatSentences(resultContent.caution)}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card/90 backdrop-blur shadow-lg p-4 space-y-3">
            <div className="flex items-center justify-center">
              <CardTitle className="text-xl">궁합 추천</CardTitle>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border bg-card/90 backdrop-blur shadow-lg p-3 text-center">
                <div className="text-sm font-semibold mb-2">잘 맞는 유형</div>
                {isValidCode(resultContent.bestMatch.code) ? (
                  <img
                    src={getImagePath(resultContent.bestMatch.code)}
                    alt={`${resultContent.bestMatch.code} 이미지`}
                    className="w-full h-28 rounded-lg object-contain cursor-pointer bg-card"
                    onClick={() => handleOpenDetail("best")}
                  />
                ) : (
                  <div className="w-full h-28 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">
                    이미지 없음
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-2">{resultContent.bestMatch.name}</div>
                {getMatchTags(resultContent.bestMatch.code) && (
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {getMatchTags(resultContent.bestMatch.code)}
                  </div>
                )}
                <Button size="sm" variant="outline" className="mt-2 w-full" onClick={() => handleOpenList("best")}>
                  매칭하러 가기
                </Button>
              </div>
              <div className="rounded-xl border bg-card/90 backdrop-blur shadow-lg p-3 text-center">
                <div className="text-sm font-semibold mb-2">다른 유형</div>
                {isValidCode(resultContent.worstMatch.code) ? (
                  <img
                    src={getImagePath(resultContent.worstMatch.code)}
                    alt={`${resultContent.worstMatch.code} 이미지`}
                    className="w-full h-28 rounded-lg object-contain cursor-pointer bg-card"
                    onClick={() => handleOpenDetail("worst")}
                  />
                ) : (
                  <div className="w-full h-28 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">
                    이미지 없음
                  </div>
                )}
                <div className="text-xs text-muted-foreground mt-2">{resultContent.worstMatch.name}</div>
                {getMatchTags(resultContent.worstMatch.code) && (
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {getMatchTags(resultContent.worstMatch.code)}
                  </div>
                )}
                <Button size="sm" variant="outline" className="mt-2 w-full" onClick={() => handleOpenList("worst")}>
                  매칭하러 가기
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button onClick={() => router.push("/test?start=1")} variant="secondary">
              다시 테스트하기
            </Button>
            <Button onClick={() => router.push("/home")}>홈으로 이동</Button>
          </div>
        </div>
        {shareStatus && <div className="text-sm text-muted-foreground text-center mt-2">{shareStatus}</div>}
      </div>

      <Dialog open={listOpen} onOpenChange={setListOpen}>
        <DialogContent className="sm:max-w-md bg-background">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">{modalTitle}</DialogTitle>
            <p className="text-sm text-muted-foreground text-center mt-2">
              온라인인 사람들 중 가치관이 {listType === "best" ? "맞는" : "다른"} 프로필입니다.
            </p>
          </DialogHeader>
          <div className="mt-4 space-y-3">
            {modalProfiles.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-2">현재 온라인인 사람이 없습니다</p>
                <p className="text-sm text-muted-foreground">나중에 다시 확인해보세요</p>
              </div>
            ) : (
              modalProfiles.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={getLoveDnaImage(listLoveDna)} alt={user.nickname} />
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {user.nickname.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background" />
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => setSelectedProfile(user.profile)}
                        className="font-semibold hover:text-primary cursor-pointer text-left"
                      >
                        {user.nickname}
                      </button>
                      <p className="text-xs text-muted-foreground">
                        선명도 {Math.round(user.profile.temperature || 0)}%
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleRequestChat(user.id, user.nickname)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    1:1 매칭 요청
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-md bg-background">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">
              {detailType === "best" ? "잘 맞는 유형" : "다른 유형"}
            </DialogTitle>
            <p className="text-sm text-muted-foreground text-center mt-2">
              {detailContent.tags}
            </p>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="flex flex-col items-center text-center gap-2">
              {detailContent.image ? (
                <img
                  src={detailContent.image}
                  alt={`${detailCode} 결과 이미지`}
                  className="w-48 h-48 object-contain rounded-xl bg-card"
                />
              ) : (
                <div className="w-48 h-48 rounded-xl bg-muted flex items-center justify-center text-sm text-muted-foreground">
                  결과 이미지
                </div>
              )}
              {detailContent.slogan && <div className="text-sm text-muted-foreground">“{detailContent.slogan}”</div>}
            </div>
            <div className="rounded-xl border bg-card/50 px-4 py-4 text-center space-y-4">
              <div>
                <div className="font-semibold mb-3">궁합 이유</div>
                <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line break-keep">
                  {formatSentences(detailReason)}
                </div>
              </div>
              <div>
                <div className="font-semibold mb-3">특징</div>
                <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line break-keep">
                  {formatSentences(detailContent.feature)}
                </div>
              </div>
              <div>
                <div className="font-semibold mb-3">주의점</div>
                <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line break-keep">
                  {formatSentences(detailContent.caution)}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <UserProfileModal
        open={!!selectedProfile}
        onOpenChange={(open) => !open && setSelectedProfile(null)}
        profile={selectedProfile || {}}
      />
    </div>
  )
}
