"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { LoginModal } from "@/components/auth/login-modal"
import { RegisterModal } from "@/components/auth/register-modal"
import { Users, Clock, Shield, Eye, MessageCircle, Heart, Zap, User2 } from "lucide-react"
import Image from "next/image"
import { Header } from "@/components/common/header"
import { BackgroundLayout } from "@/components/common/background-layout"

export function LandingPage() {
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)

  return (
    <BackgroundLayout
      imageOpacity={30}
      overlayClassName="bg-gradient-to-b from-background/50 via-background/30 to-background/50"
      useNextImage={true}
    >
      {/* Header */}
      <Header
        onLoginClick={() => setShowLogin(true)}
        onRegisterClick={() => setShowRegister(true)}
      />

        {/* Hero Section */}
        <section className="pt-32 sm:pt-40 pb-16 sm:pb-24 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 sm:mb-8 text-balance">
              <span className="text-foreground">얼굴보다</span>
              <br />
              <span className="text-primary">마음이 먼저</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10 sm:mb-12 text-pretty px-4">
              블러 처리된 화면에서 시작하는 특별한 소개팅.
              <br className="hidden sm:block" />
              <span className="sm:hidden"> </span>
              대화를 나눌수록 서서히 드러나는 상대방의 모습을 만나보세요.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 px-4">
              <Button
                size="lg"
                onClick={() => setShowRegister(true)}
                className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-lg shadow-lg"
              >
                무료로 시작하기
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setShowLogin(true)}
                className="w-full sm:w-auto px-8 py-6 text-lg bg-card/50 backdrop-blur-sm border-transparent hover:bg-card/50 hover:text-foreground hover:border-transparent"
              >
                이미 계정이 있어요
              </Button>
            </div>
          </div>
        </section>

        {/* Matching Methods - 2col layout */}
        <section className="py-12 sm:py-20 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-foreground">매칭 방식</h2>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto text-lg">
              원하는 방식으로 특별한 인연을 만나보세요
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* 빠른 매칭 */}
              <div className="relative overflow-hidden rounded-3xl bg-card/70 backdrop-blur-md p-8 border border-border/50 shadow-xl hover:shadow-2xl transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-6">
                    <Zap className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-foreground">빠른 매칭</h3>
                  <p className="text-muted-foreground mb-6">
                    지금 바로 온라인 중인 사람과 연결됩니다. 버튼 하나로 즉시 시작하세요.
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      평균 대기시간 30초 이내
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      랜덤 매칭으로 새로운 만남
                    </li>
                  </ul>
                </div>
              </div>

              {/* 1:1 매칭 */}
              <div className="relative overflow-hidden rounded-3xl bg-card/70 backdrop-blur-md p-8 border border-border/50 shadow-xl hover:shadow-2xl transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/20 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-6">
                    <User2 className="w-8 h-8 text-secondary-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-foreground">1:1 매칭</h3>
                  <p className="text-muted-foreground mb-6">
                    이전에 만났던 사람에게 다시 연락할 수 있습니다. 좋은 인상을 받았다면 재매칭 요청을 보내보세요.
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                      이력이 있는 사람만 선택 가능
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                      온라인 상태 실시간 표시
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Preview */}
        <section className="py-16 sm:py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="relative order-2 md:order-1">
                <div className="aspect-[4/3] rounded-3xl bg-card/70 backdrop-blur-md overflow-hidden shadow-2xl border border-border/50">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="grid grid-cols-2 gap-4 p-6 w-full">
                      <div className="aspect-video rounded-2xl bg-secondary/50 blur-[8px] flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-accent" />
                      </div>
                      <div className="aspect-video rounded-2xl bg-primary/30 blur-[8px] flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-primary" />
                      </div>
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-card/90 backdrop-blur-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">1라운드 - 04:32</span>
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-foreground">단계별 블라인드 해제</h2>
                <p className="text-muted-foreground mb-6 text-lg">
                  처음에는 블러 처리된 화면으로 시작해요. 대화가 이어질수록 블러가 서서히 옅어지며, 마지막 라운드에서
                  서로의 모습이 완전히 공개됩니다.
                </p>
                <div className="flex flex-wrap gap-3">
                  {["1R: 강한 블러", "2R: 약한 블러", "3R: 투명", "4R: 완전 공개"].map((stage) => (
                    <span key={stage} className="px-4 py-2 rounded-full text-sm bg-card/70 backdrop-blur-sm border border-border/50">
                      {stage}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 sm:py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-foreground">왜 Unblur인가요?</h2>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto text-lg">
              외모가 아닌 대화로 시작하는 만남. 진정한 연결을 경험해보세요.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[
                {
                  icon: Eye,
                  title: "단계적 공개",
                  description: "시간이 지날수록 블러가 옅어지며, 자연스럽게 서로를 알아가요.",
                },
                {
                  icon: MessageCircle,
                  title: "대화 서포트",
                  description: "어색한 침묵? 걱정 마세요. AI가 대화 주제를 추천해드려요.",
                },
                { icon: Users, title: "다양한 매칭", description: "빠른 매칭, 1:1 재매칭, MBTI 기반 매칭까지." },
                {
                  icon: Clock,
                  title: "라운드 시스템",
                  description: "5분, 10분, 10분, 무제한. 서로 동의해야 다음 라운드로!",
                },
                {
                  icon: Heart,
                  title: "밸런스 게임",
                  description: "재미있는 게임으로 가치관과 연애관을 자연스럽게 파악해요.",
                },
                {
                  icon: Shield,
                  title: "안전한 만남",
                  description: "비매너 사용자 신고 및 차단으로 안전한 환경을 제공해요.",
                },
              ].map((feature) => (
                <div key={feature.title} className="p-6 rounded-2xl bg-card/70 backdrop-blur-md border border-border/50 hover:shadow-xl transition-all">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 sm:py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-foreground">어떻게 진행되나요?</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { step: "01", title: "회원가입", desc: "간단한 정보만 입력하세요" },
                { step: "02", title: "매칭 선택", desc: "원하는 방식으로 매칭" },
                { step: "03", title: "블라인드 대화", desc: "블러 화면으로 대화 시작" },
                { step: "04", title: "라운드 진행", desc: "서로 동의하면 다음 단계로" },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary mx-auto mb-4 flex items-center justify-center shadow-lg">
                    <span className="text-xl font-bold text-white">{item.step}</span>
                  </div>
                  <h3 className="font-semibold mb-2 text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 sm:py-24 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-foreground">지금 시작해보세요</h2>
            <p className="text-muted-foreground mb-8 text-lg">
              2030 세대를 위한 새로운 소개팅 경험이 기다리고 있어요.
            </p>
            <Button
              size="lg"
              onClick={() => setShowRegister(true)}
              className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-lg shadow-lg"
            >
              무료로 시작하기
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-4 border-t border-border/30 backdrop-blur-sm bg-transparent">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Unblur Logo" width={32} height={32} className="object-contain" style={{ filter: 'brightness(0) saturate(100%) invert(25%) sepia(5%) saturate(0%) hue-rotate(0deg) brightness(95%) contrast(90%)' }} />
              <span className="font-bold text-lg text-foreground">Unblur</span>
            </div>
            <p className="text-sm text-muted-foreground">© 2026 Unblur. All rights reserved.</p>
          </div>
        </footer>

        {/* Modals */}
        <LoginModal
          open={showLogin}
          onOpenChange={setShowLogin}
          onSwitchToRegister={() => {
            setShowLogin(false)
            setShowRegister(true)
          }}
        />
        <RegisterModal
          open={showRegister}
          onOpenChange={setShowRegister}
          onSwitchToLogin={() => {
            setShowRegister(false)
            setShowLogin(true)
          }}
        />
    </BackgroundLayout>
  )
}
